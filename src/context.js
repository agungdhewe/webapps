let __dir
let __rootDirectory

export default {
	setWebappsDirectory: (dirname)=>{ __dir=dirname },
	getWebappsDirectory: () => { return __dir },

	setRootDirectory: (rootdir) => { __rootDirectory=rootdir },
	getRootDirectory: () => { return __rootDirectory }
}




