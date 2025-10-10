let __dir
let __rootDirectory



let fnParseModuleRequest

export default {
	setWebappsDirectory: (dirname)=>{ __dir=dirname },
	getWebappsDirectory: () => { return __dir },

	setRootDirectory: (rootdir) => { __rootDirectory=rootdir },
	getRootDirectory: () => { return __rootDirectory },


	setFnParseModuleRequest: (fn) => {
		fnParseModuleRequest = fn
	},
	getFnParseModuleRequest: (fn) => {
		return fnParseModuleRequest
	}
}




