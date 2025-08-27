import Context from './generator-context.mjs'
import * as generatorList from './generatorList.mjs'
import * as generatorEdit from './generatorEdit.mjs'
import * as generatorExtender from './generator-ext.mjs'

const app = Context.app
const Crsl = Context.Crsl


export default class extends Module {
	constructor() {
		super()
	}

	async main(args={}) {
		
		console.log('initializing module...')
		app.setTitle('Generator')
		app.showFooter(true)
		
		args.autoLoadGridData = true

		const self = this


		// module-module yang di load perlu di pack dulu ke dalam variable
		// jangan import lagi module-module ini di dalam mjs tersebut
		// karena akan terjadi cyclic redudancy pada saat di rollup
		self.Modules = {
			generatorList,
			generatorEdit,
			generatorExtender
		}

		try {
			
			// inisiasi sisi server
			try {
				const result = await Module.apiCall(`/${Context.moduleName}/init`, { })
				Context.notifierId = result.notifierId
				Context.notifierSocket = result.notifierSocket
				Context.userId = result.userId
				Context.userFullname = result.userFullname
				Context.sid = result.sid
			} catch (err) {
				throw err
			} 


			await Promise.all([
				generatorList.init(self, args),
				generatorEdit.init(self, args),
				generatorExtender.init(self, args)
			])

			// render dan setup halaman
			await render(self)




		} catch (err) {
			throw err
		}
	}


}



async function render(self) {
	try {
		const footerButtonsContainer =  document.getElementsByClassName('footer-buttons-container')
		Module.renderFooterButtons(footerButtonsContainer)
	
		Crsl.addEventListener($fgta5.SectionCarousell.EVT_SECTIONSHOWING, (evt)=>{
			var sectionId = evt.detail.commingSection.Id
			for (let cont of footerButtonsContainer) {
				var currContainerSectionId = cont.getAttribute('data-section')
				if (currContainerSectionId==sectionId) {
					setTimeout(()=>{
						cont.classList.remove('hidden')
						cont.style.animation = 'dropped 0.3s forwards'
						setTimeout(()=>{
							cont.style.animation = 'unset'	
						}, 300)
					}, 500)
				} else {
					cont.classList.add('hidden')
				}
			}
		})

		// generator-ext.mjs, export function extendPage(self) {} 
		// jangan exekusi langsung dari userExtender, karena akan error saat di rollup
		const extendPage = self.Modules.generatorExtender.extendPage
		if (typeof extendPage === 'function') {
			extendPage(self)
		} else {
			console.warn(`'extendPage' tidak diimplementasikan di extender`)
		}

	} catch (err) {
		throw err
	}
}