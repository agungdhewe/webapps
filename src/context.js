let __dir
let __rootDirectory



let fnParseModuleRequest
let apiCache = true


export default {

	alwaysLoadApi: (cached = true) => {
		apiCache = cached
	},
	isApiCached: () => {
		return apiCache
	},

	setWebappsDirectory: (dirname) => { __dir = dirname },
	getWebappsDirectory: () => { return __dir },

	setRootDirectory: (rootdir) => { __rootDirectory = rootdir },
	getRootDirectory: () => { return __rootDirectory },


	setFnParseModuleRequest: (fn) => {
		fnParseModuleRequest = fn
	},
	getFnParseModuleRequest: (fn) => {
		return fnParseModuleRequest
	}
}




