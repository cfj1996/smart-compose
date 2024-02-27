# 智能提示工具使用

1. 源码在src[src](src)目录下
2. 例子在[example](example)，一个是textarea的例子，一个是可编辑div例子
3. 运行例子需要执行如下命令
   ```shell
   yarn build
   yarn link
   yarn devServer
   cd example/textarea
   yarn dev
   ```

# 以及实现实现的功能

1. textarea输入框智能提示（githud的输入框上可以正常运行）
2. 可编辑div输入框智能提示（tiptap的编辑器外部脚本无法修改dom属性，目前没有实现思路，
   如过要实现则需要通过tiptap的api操作节点，但是这实现前提是能拿到编辑器的实例，考题要求是通过脚本引入这样是无法提供编辑器的实例）
