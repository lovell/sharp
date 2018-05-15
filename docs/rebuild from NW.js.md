# Rebuild
* after installing the Sharp module with CLI cd into the `node-modules/sharp`  
* rebuild `nw-gyp rebuild --target=[your nw version] --arch=[x64,ia32]`without brackets, [for more details](http://docs.nwjs.io/en/latest/For%20Users/Advanced/Use%20Native%20Node%20Modules/)    
* run `node node_modules\sharp\install\dll-copy`
## Prerequisites
* node
* nw-gyp
* sharp
