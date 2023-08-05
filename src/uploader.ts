import { PluginSettings } from "./setting";
import { streamToString, getLastImage } from "./utils";
import { exec, spawnSync, spawn } from "child_process";
import { Notice, requestUrl } from "obsidian";
import imageAutoUploadPlugin from "./main";
import * as fs from 'fs';
import { parseString } from 'xml2js';

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

export class BlogUploader {
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
        // If the path is an HTTP URL, download the image data first
        const response = await requestUrl(imagePath.toString());
        imageData = await Buffer.from(response.text);
      } else {
        // If it is a local path, read the image directly
        imageData = fs.readFileSync(imagePath.toString());
      }

      const mediaInfo = await this.upload(imageData.toString('base64'));
      urls.push(mediaInfo);
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
      const imageData = await this.fileToBase64(clipboardData.files[i]);
      const url = await this.upload(imageData);
      urls.push(url)
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

  async upload(imageData: string): Promise<string> {
    const metaWeblogUrl = this.settings.blogUrl;
    const blogId = this.settings.blodId;
    const username = this.settings.blogUserName;
    const password = this.settings.blogPassword;

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
    console.log('mediaInfo:', mediaInfo);
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
