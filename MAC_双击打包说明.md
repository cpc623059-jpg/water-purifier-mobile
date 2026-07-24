# Mac 双击打包说明

如果你不想敲命令，就把整个项目拷到 Mac，然后直接双击下面这些文件：

1. `01-双击-准备Mac环境.command`
2. `02-双击-生成未签名IPA.command`

如果你要签名安装包：

1. 先双击 `01-双击-准备Mac环境.command`
2. 再双击 `03-双击-打开Xcode.command`
3. 在 Xcode 里设置签名
4. 最后双击 `04-双击-导出已签名IPA.command`

默认输出位置：

- 未签名 IPA：`build/ios/PureWater-unsigned.ipa`
- 已签名导出目录：`build/ios/development-export`
