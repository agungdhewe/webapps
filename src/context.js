let __dir
let __rootDirectory

export default {
	setMyDirectory: (dirname)=>{ __dir=dirname },
	getMyDirectory: () => { return __dir },

	setRootDirectory: (rootdir) => { __rootDirectory=rootdir },
	getRootDirectory: () => { return __rootDirectory }
}




