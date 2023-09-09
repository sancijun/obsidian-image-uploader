import { PluginSettings } from "./setting";
import { streamToString, getLastImage } from "./utils";
import { exec } from "child_process";
import { Notice, requestUrl } from "obsidian";
import imageAutoUploadPlugin from "./main";
import * as fs from 'fs';
import { parseString } from 'xml2js';
import * as path from 'path';
import COS from 'cos-js-sdk-v5';


export interface PicGoResponse {
  success: string;
  msg: string;
  result: string[];
  fullResult: Record<string, any>[];
}

export class PicGoUploader {
  settings: PluginSettings;
  plugin: imageAutoUploadPlugin;

  constructor(settings: PluginSettings, plugin: imageAutoUploadPlugin) {
    this.settings = settings;
    this.plugin = plugin;
  }

  async uploadFiles(fileList: Array<String>): Promise<any> {
    const response = await requestUrl({
      url: this.settings.uploadServer,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ list: fileList }),
    });

    const data = await response.json;

    // piclist
    if (data.fullResult) {
      const uploadUrlFullResultList = data.fullResult || [];
      this.settings.uploadedImages = [
        ...(this.settings.uploadedImages || []),
        ...uploadUrlFullResultList,
      ];
    }

    return data;
  }

  async uploadFileByClipboard(clipboardData: DataTransfer): Promise<any> {
    const res = await requestUrl({
      url: this.settings.uploadServer,
      method: "POST",
    });

    let data: PicGoResponse = await res.json;

    // piclist
    if (data.fullResult) {
      const uploadUrlFullResultList = data.fullResult || [];
      this.settings.uploadedImages = [
        ...(this.settings.uploadedImages || []),
        ...uploadUrlFullResultList,
      ];
      this.plugin.saveSettings();
    }

    if (res.status !== 200) {
      let err = { response: data, body: data.msg };
      return {
        code: -1,
        msg: data.msg,
        data: "",
      };
    } else {
      return {
        code: 0,
        msg: "success",
        data: typeof data.result == "string" ? data.result : data.result[0],
      };
    }
  }
}

export class PicGoCoreUploader {
  settings: PluginSettings;
  plugin: imageAutoUploadPlugin;

  constructor(settings: PluginSettings, plugin: imageAutoUploadPlugin) {
    this.settings = settings;
    this.plugin = plugin;
  }

  async uploadFiles(fileList: Array<String>): Promise<any> {
    const length = fileList.length;
    let cli = this.settings.picgoCorePath || "picgo";
    let command = `${cli} upload ${fileList
      .map(item => `"${item}"`)
      .join(" ")}`;

    const res = await this.exec(command);
    const splitList = res.split("\n");
    const splitListLength = splitList.length;

    const data = splitList.splice(splitListLength - 1 - length, length);

    if (res.includes("PicGo ERROR")) {
      console.log(command, res);

      return {
        success: false,
        msg: "失败",
      };
    } else {
      return {
        success: true,
        result: data,
      };
    }
    // {success:true,result:[]}
  }

  // PicGo-Core 上传处理
  async uploadFileByClipboard(clipboardData: DataTransfer) {
    const res = await this.uploadByClip();
    const splitList = res.split("\n");
    const lastImage = getLastImage(splitList);

    if (lastImage) {
      return {
        code: 0,
        msg: "success",
        data: lastImage,
      };
    } else {
      console.log(splitList);

      // new Notice(`"Please check PicGo-Core config"\n${res}`);
      return {
        code: -1,
        msg: `"Please check PicGo-Core config"\n${res}`,
        data: "",
      };
    }
  }

  // PicGo-Core的剪切上传反馈
  async uploadByClip() {
    let command;
    if (this.settings.picgoCorePath) {
      command = `${this.settings.picgoCorePath} upload`;
    } else {
      command = `picgo upload`;
    }
    const res = await this.exec(command);
    // const res = await this.spawnChild();

    return res;
  }

  async exec(command: string) {
    let { stdout } = await exec(command);
    const res = await streamToString(stdout);
    return res;
  }

  async spawnChild() {
    const { spawn } = require("child_process");
    const child = spawn("picgo", ["upload"], {
      shell: true,
    });

    let data = "";
    for await (const chunk of child.stdout) {
      data += chunk;
    }
    let error = "";
    for await (const chunk of child.stderr) {
      error += chunk;
    }
    const exitCode = await new Promise((resolve, reject) => {
      child.on("close", resolve);
    });

    if (exitCode) {
      throw new Error(`subprocess error exit ${exitCode}, ${error}`);
    }
    return data;
  }
}

export abstract class BaseUploader {
  settings: PluginSettings;
  plugin: imageAutoUploadPlugin;

  constructor(settings: PluginSettings, plugin: imageAutoUploadPlugin) {
    this.settings = settings;
    this.plugin = plugin;
  }

  async uploadFiles(fileList: String[]): Promise<any> {
    console.log('uploadFiles', fileList);
    const urls: any[] = [];

    for (const imagePath of fileList) {
      let imageData: Buffer;

      if (imagePath.startsWith('http')) {
        const response = await requestUrl(imagePath.toString());
        imageData = await Buffer.from(response.text);
      } else {
        imageData = fs.readFileSync(imagePath.toString());
      }
      const fileName = this.settings.rename
        ? `${this.getCurrentTimestamp()}${path.extname(imagePath.toString())}`
        : path.basename(imagePath.toString());
      const imageUrl = await this.upload(imageData.toString('base64'), fileName);
      urls.push(imageUrl);
    }
    console.log('urls', urls)
    return {
      success: true,
      result: urls,
    };
  }

  async uploadFileByClipboard(clipboardData: DataTransfer): Promise<any> {
    console.log('uploadFileByClipboard', clipboardData.types);
    const urls = [];
    // 处理每个文件
    for (let i = 0; i < clipboardData.files.length; i++) {
      const fileName = `${this.getCurrentTimestamp()}${path.extname(clipboardData.files[i].name)}`;
      const imageData = await this.fileToBase64(clipboardData.files[i]);
      const imageUrl = await this.upload(imageData, fileName);
      urls.push(imageUrl)
    }
    console.log('urls', urls)
    return {
      code: 0,
      msg: "success",
      data: urls[0],
    };
  }

  async fileToBase64(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const base64String = reader.result as string;
        const base64 = base64String.split(",")[1]; // 去除前缀 "data:xxx;base64,"
        resolve(base64);
      };

      reader.onerror = () => {
        reject(new Error("无法读取文件"));
      };

      reader.readAsDataURL(file);
    });
  }

  getCurrentTimestamp(): string {
    const now = new Date();

    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    const milliseconds = now.getMilliseconds().toString().padStart(3, '0');

    const formattedTimestamp = `${year}${month}${day}${hours}${minutes}${seconds}${milliseconds}`;
    return formattedTimestamp;
  }

  abstract upload(imageData: string, fileName: string): Promise<string>;
}

export class BlogUploader extends BaseUploader {

  async upload(imageData: string, fileName: string): Promise<string> {
    const metaWeblogUrl = this.settings.blogSetting.blogId;
    const blogId = this.settings.blogSetting.blogId;
    const username = this.settings.blogSetting.blogUserName;
    const password = this.settings.blogSetting.blogPassword;

    const imageDataInfo = {
      name: 'image.jpg',
      type: 'image/jpeg',
      bits: imageData, // Convert binary data to Base64 string
    };

    // Convert imageDataInfo to a string in XML-RPC format
    const xmlData = `<?xml version="1.0"?>
            <methodCall>
                <methodName>metaWeblog.newMediaObject</methodName>
                <params>
                    <param>
                        <value>
                            <string>${blogId}</string>
                        </value>
                    </param>
                    <param>
                        <value>
                            <string>${username}</string>
                        </value>
                    </param>
                    <param>
                        <value>
                            <string>${password}</string>
                        </value>
                    </param>
                    <param>
                        <value>
                            <struct>
                                <member>
                                    <name>name</name>
                                    <value>
                                        <string>${imageDataInfo.name}</string>
                                    </value>
                                </member>
                                <member>
                                    <name>type</name>
                                    <value>
                                        <string>${imageDataInfo.type}</string>
                                    </value>
                                </member>
                                <member>
                                    <name>bits</name>
                                    <value>
                                        <base64>${imageDataInfo.bits}</base64>
                                    </value>
                                </member>
                            </struct>
                        </value>
                    </param>
                </params>
            </methodCall>`;

    const headers = {
      'Content-Type': 'text/xml', // Set the correct Content-Type for XML-RPC
    };

    const response = await requestUrl({
      url: metaWeblogUrl,
      method: 'POST',
      headers: headers,
      body: xmlData,
    });

    const mediaInfo = await response.text;
    const imageUrl = await this.parseMediaInfo(mediaInfo);
    console.log('Image URL:', imageUrl);
    return imageUrl;
  }

  async parseMediaInfo(mediaInfo: string): Promise<string> {
    return new Promise((resolve, reject) => {
      parseString(mediaInfo, (err, result) => {
        if (err) {
          reject(err);
        } else {
          const imageUrl =
            result.methodResponse.params[0].param[0].value[0].struct[0].member[0]
              .value[0].string[0];
          resolve(imageUrl);
        }
      });
    });
  }
}

export class GithubUploader extends BaseUploader {

  async upload(imageData: string, fileName: string): Promise<string> {
    const fileKey = path.join(this.settings.githubSetting.path, fileName);
    const apiUrl = `https://api.github.com/repos/${this.settings.githubSetting.repo}/contents/${fileKey}`;

    const requestData = {
      message: `Upload ${fileKey}`,
      branch: this.settings.githubSetting.branch,
      content: imageData,
    };

    const response = await requestUrl({
      url: apiUrl,
      method: 'PUT',
      headers: {
        Authorization: `token ${this.settings.githubSetting.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });

    const customUrl = this.settings.githubSetting.customUrl.trim();
    const imageUrl = customUrl === '' ? response.json.content.download_url : customUrl + response.json.content.path;
    return imageUrl;
  }
}

export class GiteeUploader extends BaseUploader {

  async upload(imageData: string, fileName: string): Promise<string> {
    const fileKey = path.join(this.settings.giteeSetting.path, fileName);
    const apiUrl = `https://gitee.com/api/v5/repos/${this.settings.giteeSetting.repo}/contents/${fileKey}`;

    // Build the API request data
    const requestData = {
      access_token: this.settings.giteeSetting.token,
      message: `Upload ${fileKey}`,
      branch: this.settings.giteeSetting.branch,
      content: imageData,
    };
      const response = await requestUrl({
        url: apiUrl,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

        console.log("gitee 200: ", response);
        const downloadUrl = response.json.content.download_url;
        return downloadUrl;
  }
}

export class TencentCosUploader extends BaseUploader {

  cos = new COS({
    SecretId: this.settings.tencentSetting.secretId,
    SecretKey: this.settings.tencentSetting.secretKey,
  });

  async upload(imageData: string, fileName: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const fileKey = this.settings.tencentSetting.path + fileName;

      this.cos.putObject(
        {
          Bucket: this.settings.tencentSetting.bucketName,
          Region: this.settings.tencentSetting.region,
          Key: fileKey,
          StorageClass: 'STANDARD',
          Body: this.base64ToBlob(imageData),
        },
        (err, data) => {
          if (err) {
            console.log("cos upload:", err)
            reject(err);
          } else {
            const location = data.Location || '';
            resolve(`https://${location}`);
          }
        }
      );
    });
  }

  base64ToBlob(base64String: string, contentType: string = ''): Blob {
    // 解码 base64 字符串为二进制数据
    const binaryString = atob(base64String);
    const byteArray = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      byteArray[i] = binaryString.charCodeAt(i);
    }

    // 创建 Blob 对象
    if (contentType === '') {
      contentType = 'application/octet-stream'; // 默认为二进制流
    }
    return new Blob([byteArray], { type: contentType });
  }

}
