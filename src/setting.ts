import { App, PluginSettingTab, Setting } from "obsidian";
import imageAutoUploadPlugin from "./main";
import { t } from "./lang/helpers";
import { getOS } from "./utils";

export interface PluginSettings {
  uploadByClipSwitch: boolean;
  uploadServer: string;
  deleteServer: string;
  imageSizeSuffix: string;
  uploader: string;
  picgoCorePath: string;
  workOnNetWork: boolean;
  newWorkBlackDomains: string;
  fixPath: boolean;
  applyImage: boolean;
  deleteSource: boolean;
  imageDesc: "origin" | "none" | "removeDefault";
  [propName: string]: any;
  blogSetting: {
    blogUrl: string;
    blogId: string;
    blogUserName: string;
    blogPassword: string;
  }
  githubSetting: {
    repo: string;
    branch: string;
    token: string;
    path: string;
    customUrl: string;
  }
  giteeSetting: {
    repo: string;
    branch: string;
    token: string;
    path: string;
    customUrl: string;
  }
  tencentSetting: {
    secretId: string;
    secretKey: string;
    region: string;
    bucketName: string;
    path: string;
  },
  rename: boolean
}

export const DEFAULT_SETTINGS: PluginSettings = {
  uploadByClipSwitch: true,
  uploader: "PicGo",
  uploadServer: "http://127.0.0.1:36677/upload",
  deleteServer: "http://127.0.0.1:36677/delete",
  imageSizeSuffix: "",
  picgoCorePath: "",
  workOnNetWork: false,
  fixPath: false,
  applyImage: true,
  newWorkBlackDomains: "",
  deleteSource: false,
  imageDesc: "origin",
  blogSetting: {
    blogUrl: "",
    blogId: "",
    blogUserName: "",
    blogPassword: "",
  },
  githubSetting: {
    repo: 'sancijun/images',
    branch: 'master', 
    token: '',
    path: 'pics/',
    customUrl: `https://cdn.jsdelivr.net/gh/sancijun/images/`
  },
  giteeSetting: {
    repo: 'sancijun/pictures',
    branch: 'master',
    token: '',
    path: '/imgs/',
    customUrl: 'https://cdn.jsdelivr.net/gh/sancijun/images/'
  },
  tencentSetting: {
    secretId: '',
    secretKey: '',
    region: 'ap-guangzhou',
    bucketName: 'sancijun-1255318116',
    path: '/test/',
  },
  rename: true,
};

export class SettingTab extends PluginSettingTab {
  plugin: imageAutoUploadPlugin;

  constructor(app: App, plugin: imageAutoUploadPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;

    const os = getOS();

    containerEl.empty();
    containerEl.createEl("h2", { text: t("Plugin Settings") });
    const contentHTML = `
      <div>
        <a href="https://space.bilibili.com/96271327" target="_blank">
          <img src="https://img.shields.io/badge/-B站-9378f0?" alt="Bilibili" />
        </a>
        <a href="https://img2023.cnblogs.com/blog/2740513/202308/2740513-20230805232943210-456006284.jpg" target="_blank">
          <img src="https://img.shields.io/badge/-抖音-9378f0?" alt="TikTok" />
        </a>
        <a href="https://img2023.cnblogs.com/blog/2740513/202308/2740513-20230805222711650-1692038416.jpg" target="_blank">
          <img src="https://img.shields.io/badge/-公众号-9378f0?logo=Weibo" alt="公众号" />
        </a>
        <a href="https://img2023.cnblogs.com/blog/2740513/202308/2740513-20230805222553308-968510341.jpg" target="_blank">
          <img src="https://img.shields.io/badge/-微信-9378f0" alt="微信" />
        </a>
      </div>
    `;

    const contentDiv = containerEl.createEl("div");
    contentDiv.innerHTML = contentHTML;

    new Setting(containerEl)
      .setName(t("Auto pasted upload"))
      .setDesc(
        t(
          "If you set this value true, when you paste image, it will be auto uploaded(you should set the picGo server rightly)"
        )
      )
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.uploadByClipSwitch)
          .onChange(async value => {
            this.plugin.settings.uploadByClipSwitch = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Default uploader"))
      .setDesc(t("Default uploader"))
      .addDropdown(cb =>
        cb
          .addOption("Blog", "Blog")
          .addOption("GitHub", "GitHub")
          .addOption("Gitee", "Gitee")
          .addOption("Tencent", "Tencent")
          .addOption("PicGo", "PicGo(app)")
          .addOption("PicGo-Core", "PicGo-Core")
          .setValue(this.plugin.settings.uploader)
          .onChange(async value => {
            this.plugin.settings.uploader = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );
    if (this.plugin.settings.uploader === "Blog") {
      new Setting(containerEl)
        .setName(t("Blog URL"))
        .setDesc(t("Blog URL"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input blog url"))
            .setValue(this.plugin.settings.blogSetting.blogUrl)
            .onChange(async key => {
              this.plugin.settings.blogSetting.blogUrl = key;
              await this.plugin.saveSettings();
            })
        );
      new Setting(containerEl)
        .setName(t("Blog ID"))
        .setDesc(t("Blog ID"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input blog ID"))
            .setValue(this.plugin.settings.blogSetting.blogId)
            .onChange(async key => {
              this.plugin.settings.blogSetting.blogId = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Blog User Name"))
        .setDesc(t("Blog User Name"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input blog user name"))
            .setValue(this.plugin.settings.blogSetting.blogUserName)
            .onChange(async key => {
              this.plugin.settings.blogSetting.blogUserName = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Blog Token"))
        .setDesc(t("Blog Token"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input blog token"))
            .setValue(this.plugin.settings.blogSetting.blogPassword)
            .onChange(async key => {
              this.plugin.settings.blogSetting.blogPassword = key;
              await this.plugin.saveSettings();
            })
        );
    }

    if (this.plugin.settings.uploader === "GitHub") {
      new Setting(containerEl)
        .setName(t("Repository"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your repository"))
            .setValue(this.plugin.settings.githubSetting.repo)
            .onChange(async key => {
              this.plugin.settings.githubSetting.repo = key;
              await this.plugin.saveSettings();
            })
        );
      new Setting(containerEl)
        .setName(t("Branch"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your branch"))
            .setValue(this.plugin.settings.githubSetting.branch)
            .onChange(async key => {
              this.plugin.settings.githubSetting.branch = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Token"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your token"))
            .setValue(this.plugin.settings.githubSetting.token)
            .onChange(async key => {
              this.plugin.settings.githubSetting.token = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Path"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your path"))
            .setValue(this.plugin.settings.githubSetting.path)
            .onChange(async key => {
              this.plugin.settings.githubSetting.path = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Custom URL"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input custom URL"))
            .setValue(this.plugin.settings.githubSetting.customUrl)
            .onChange(async key => {
              this.plugin.settings.githubSetting.customUrl = key;
              await this.plugin.saveSettings();
            })
        );
    }

    if (this.plugin.settings.uploader === "Gitee") {
      new Setting(containerEl)
        .setName(t("Repository"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your repository"))
            .setValue(this.plugin.settings.giteeSetting.repo)
            .onChange(async key => {
              this.plugin.settings.giteeSetting.repo = key;
              await this.plugin.saveSettings();
            })
        );
      new Setting(containerEl)
        .setName(t("Branch"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your branch"))
            .setValue(this.plugin.settings.giteeSetting.branch)
            .onChange(async key => {
              this.plugin.settings.giteeSetting.branch = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Token"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your token"))
            .setValue(this.plugin.settings.giteeSetting.token)
            .onChange(async key => {
              this.plugin.settings.giteeSetting.token = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Path"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your path"))
            .setValue(this.plugin.settings.giteeSetting.path)
            .onChange(async key => {
              this.plugin.settings.giteeSetting.path = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Custom URL"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input custom URL"))
            .setValue(this.plugin.settings.giteeSetting.customUrl)
            .onChange(async key => {
              this.plugin.settings.giteeSetting.customUrl = key;
              await this.plugin.saveSettings();
            })
        );
    }

    if (this.plugin.settings.uploader === "Tencent") {
      new Setting(containerEl)
        .setName(t("Secret ID"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your secret ID"))
            .setValue(this.plugin.settings.tencentSetting.secretId)
            .onChange(async key => {
              this.plugin.settings.tencentSetting.secretId = key;
              await this.plugin.saveSettings();
            })
        );
      new Setting(containerEl)
        .setName(t("Secret Key"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your secret key"))
            .setValue(this.plugin.settings.tencentSetting.secretKey)
            .onChange(async key => {
              this.plugin.settings.tencentSetting.secretKey = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Region"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your region"))
            .setValue(this.plugin.settings.tencentSetting.region)
            .onChange(async key => {
              this.plugin.settings.tencentSetting.region = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Bucket"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your bucket name"))
            .setValue(this.plugin.settings.tencentSetting.bucketName)
            .onChange(async key => {
              this.plugin.settings.tencentSetting.bucketName = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("Path"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input your path"))
            .setValue(this.plugin.settings.tencentSetting.path)
            .onChange(async key => {
              this.plugin.settings.tencentSetting.path = key;
              await this.plugin.saveSettings();
            })
        );
    }

    if (this.plugin.settings.uploader === "PicGo") {
      new Setting(containerEl)
        .setName(t("PicGo server"))
        .setDesc(t("PicGo server"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input PicGo server"))
            .setValue(this.plugin.settings.uploadServer)
            .onChange(async key => {
              this.plugin.settings.uploadServer = key;
              await this.plugin.saveSettings();
            })
        );

      new Setting(containerEl)
        .setName(t("PicGo delete server"))
        .setDesc(t("PicList desc"))
        .addText(text =>
          text
            .setPlaceholder(t("Please input PicGo delete server"))
            .setValue(this.plugin.settings.deleteServer)
            .onChange(async key => {
              this.plugin.settings.deleteServer = key;
              await this.plugin.saveSettings();
            })
        );
    }

    if (this.plugin.settings.uploader === "PicGo-Core") {
      new Setting(containerEl)
        .setName(t("PicGo-Core path"))
        .setDesc(
          t("Please input PicGo-Core path, default using environment variables")
        )
        .addText(text =>
          text
            .setPlaceholder("")
            .setValue(this.plugin.settings.picgoCorePath)
            .onChange(async value => {
              this.plugin.settings.picgoCorePath = value;
              await this.plugin.saveSettings();
            })
        );

      if (os !== "Windows") {
        new Setting(containerEl)
          .setName(t("fixPath"))
          .setDesc(t("fixPathWarning"))
          .addToggle(toggle =>
            toggle
              .setValue(this.plugin.settings.fixPath)
              .onChange(async value => {
                this.plugin.settings.fixPath = value;
                await this.plugin.saveSettings();
              })
          );
      }
    }

    new Setting(containerEl)
        .setName(t("Rename"))
        .setDesc(t("Rename Desc"))
        .addToggle(toggle =>
          toggle
            .setValue(this.plugin.settings.rename)
            .onChange(async value => {
              this.plugin.settings.rename = value;
              this.display();
              await this.plugin.saveSettings();
            })
        );

    // image desc setting
    new Setting(containerEl)
      .setName(t("Image desc"))
      .setDesc(t("Image desc"))
      .addDropdown(cb =>
        cb
          .addOption("origin", t("reserve")) // 保留全部
          .addOption("none", t("remove all")) // 移除全部
          .addOption("removeDefault", t("remove default")) // 只移除默认即 image.png
          .setValue(this.plugin.settings.imageDesc)
          .onChange(async (value: "origin" | "none" | "removeDefault") => {
            this.plugin.settings.imageDesc = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Image size suffix"))
      .setDesc(t("Image size suffix Description"))
      .addText(text =>
        text
          .setPlaceholder(t("Please input image size suffix"))
          .setValue(this.plugin.settings.imageSizeSuffix)
          .onChange(async key => {
            this.plugin.settings.imageSizeSuffix = key;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Work on network"))
      .setDesc(t("Work on network Description"))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.workOnNetWork)
          .onChange(async value => {
            this.plugin.settings.workOnNetWork = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Network Domain Black List"))
      .setDesc(t("Network Domain Black List Description"))
      .addTextArea(textArea =>
        textArea
          .setValue(this.plugin.settings.newWorkBlackDomains)
          .onChange(async value => {
            this.plugin.settings.newWorkBlackDomains = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Upload when clipboard has image and text together"))
      .setDesc(
        t(
          "When you copy, some application like Excel will image and text to clipboard, you can upload or not."
        )
      )
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.applyImage)
          .onChange(async value => {
            this.plugin.settings.applyImage = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName(t("Delete source file after you upload file"))
      .setDesc(t("Delete source file in ob assets after you upload file."))
      .addToggle(toggle =>
        toggle
          .setValue(this.plugin.settings.deleteSource)
          .onChange(async value => {
            this.plugin.settings.deleteSource = value;
            this.display();
            await this.plugin.saveSettings();
          })
      );
  }
}
