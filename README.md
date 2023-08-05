# Obsidian Image Uploader

这是一个支持 Blog MetaWeblog API、PicGo、PicGo-Core 上传图片到图床的工具
**更新插件后记得重启一下 Obsidian**

# 开始

## 基于 Blog MetaWeblog API（推荐)

什么是 Blog MetaWeblog API 呢？简单来说，就是直接将图片上传到博客网站的服务器，例如上传到博客园，开源中国。你不需要新建 Github 库，不需要买腾讯云/阿里云/七牛云，不需要买域名，备案，不需要买 CDN 就可以拥有性能良好的图床。

以博客园为例：打开博客园设置，开启 MetaWebblog，获取必登录用户名，登录令牌，图片上传的接口地址（BlogURL)，用户 ID（就是接口地址最后一段，图片中就是 sancijun）

![image.png](https://img2023.cnblogs.com/blog/2740513/202308/2740513-20230805155248341-460300794.jpg)

打开 Obsidian 插件，设置插件参数：

![image.png](https://img2023.cnblogs.com/blog/2740513/202308/2740513-20230805160020170-452969692.png)

## 基于 PicGo

1. 安装 PicGo 工具，并进行配置，配置参考[官网](https://github.com/Molunerfinn/PicGo)
2. 开启 PicGo 的 Server 服务，并记住端口号
3. 安装插件
4. 打开插件配置项，设置为http://127.0.0.1:{{PicGo设置的端口号}}/upload（例如：http://127.0.0.1:36677/upload）
5. 接下来试试看能否上传成功

# 特性

## 剪切板上传

支持黏贴剪切板的图片的时候直接上传，目前支持复制系统内图像直接上传。
支持通过设置 `frontmatter` 来控制单个文件的上传，默认值为 `true`，控制关闭请将该值设置为 `false`

支持 ".png", ".jpg", ".jpeg", ".bmp", ".gif", ".svg", ".tiff"

该功能在 PicGo 2.3.0-beta7 版本中无法使用，请更换其他版本

```yaml
---
image-auto-upload: true
---
```

## 批量上传一个文件中的所有图像文件

输入 `ctrl+P` 呼出面板，输入 `upload all images`，点击回车，就会自动开始上传。

路径解析优先级，会依次按照优先级查找：

1. 绝对路径，指基于库的绝对路径
2. 相对路径，以./或../开头
3. 尽可能简短的形式

## 批量下载网络图片到本地

输入 `ctrl+P` 呼出面板，输入 `download all images`，点击回车，就会自动开始下载。只在 win 进行过测试

## 支持右键菜单上传图片

目前已支持标准 md 以及 wiki 格式。支持相对路径以及绝对路径，需要进行正确设置，不然会引发奇怪的问题

## 支持拖拽上传

仅在使用 picGo 客户端时生效

## 支持 Picgo-Core

目前已经全功能支持

### 安装

[官方文档：全局安装](https://picgo.github.io/PicGo-Core-Doc/zh/guide/getting-started.html#%E5%85%A8%E5%B1%80%E5%AE%89%E8%A3%85)

### PicGo-Core 配置

[官方文档：配置](https://picgo.github.io/PicGo-Core-Doc/zh/guide/config.html#%E9%BB%98%E8%AE%A4%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6)

### 插件配置

`Default uploader` 选择 `PicGo-Core`
设置路径，默认为空，使用环境变量
也可以设置自定义路径

# TODO

- [ ] 支持添加水印
- [ ] 支持同时使用 Blog MetaWeblog API + PicGo 作为备份

# Thanks

本插件是基于
