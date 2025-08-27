import Context from './generator-context.mjs'
import AppGenUI from './appgen-ui.mjs'
import * as Extender from './generator-ext.mjs'


const CurrentState = {}
const Crsl =  Context.Crsl
const CurrentSectionId = Context.Sections.generatorEdit
const CurrentSection = Crsl.Items[CurrentSectionId]

const ui = new AppGenUI(Context.app)
const btn_new = new $fgta5.ActionButton('generatorEdit-btn_new', 'generator-new')
const btn_save = new $fgta5.ActionButton('generatorEdit-btn_save')
const btn_generate = new $fgta5.ActionButton('generatorEdit-btn_generate')

export const Section = CurrentSection

export async function init(self, args) {
	console.log('initializing generatorEdit ...')

	CurrentSection.addEventListener($fgta5.Section.EVT_BACKBUTTONCLICK, async (evt)=>{
			backToList(self, evt)
		})


	btn_new.addEventListener('click', (evt)=>{ btn_new_click(self, evt)})
	btn_save.addEventListener('click', (evt)=>{ btn_save_click(self, evt)})
	btn_generate.addEventListener('click', (evt)=>{ btn_generate_click(self, evt) })

	await ui.Init()

	ui.pauseAutoSave(true)

}

export async function openSelectedData(self, params) {
	console.log('openSelectedData')

	let mask = $fgta5.Modal.createMask()
	try {
		const id = params.keyvalue
		
		console.log(params)
		const result = await openData(self, id)
		const data = result.generator_data

		data.id = result.generator_id
	
		ui.load(data)
	} catch (err) {
		throw err
	} finally {
		mask.close()
		mask = null
	}
}


async function openData(self, id) {
	const apiOpen = new $fgta5.ApiEndpoint(`/${Context.moduleName}/open`)
	try {
		const result = await apiOpen.execute({ id })
		return result
	} catch (err) {
		CurrentState.currentOpenedId = null
		throw err
	} finally {
		apiOpen.dispose()
	}
}

async function backToList(self, evt) {
	let goback = true
	if (goback) {
		evt.detail.fn_ShowNextSection()
	}
}

async function btn_new_click(self, evt) {
	console.log('btn_new_click')
	const sourceSection = evt.target.getAttribute('data-sectionsource') 
	const generatorList = self.Modules.generatorList
	const listsecid = generatorList.Section.Id
	const fromListSection = sourceSection===listsecid
	if (fromListSection) {
		// btn new di klik dari list
		await CurrentSection.show()

		// cek id, jika tidak kosong, perlu di-reset
		const id = document.getElementById('obj_programid')
		if (id!='') {
			await ui.reset()
			await ui.NewData()
			ui.updateCache()
		}

	} else {
		const resp = await $fgta5.MessageBox.confirm('apakah anda yakin akan membuat data baru?')
		if (resp=='ok') {
			await ui.reset()
			await ui.NewData()
			ui.updateCache()
		}
	} 
	
}

async function btn_save_click(self, evt) {
	console.log('btn_save_click')
	const data = await ui.getCurrentData()
	
	let mask = $fgta5.Modal.createMask()
	try {
		const result = await Save(self, data)
		ui.setCurrentId(result.generator_id)

		console.log(result)
	} catch (err) {
		console.error(err)
		$fgta5.MessageBox.error(err.message)
	} finally {
		mask.close()
		mask = null
	}
}


async function btn_generate_click(self, evt)  {
	console.log('btn_generate_click')
	const data = await ui.getCurrentData()
	
	let mask = $fgta5.Modal.createMask()
	btn_generate.disabled = true
	ui.pauseAutoSave(true)
	try {
		if (data.id=='') {
			throw new Error('save dahulu sebelum generate')
		}
		const result = await Generate(self, data, mask)
		console.log(result)
		$fgta5.MessageBox.info('done')
	} catch (err) {
		console.error(err)
		$fgta5.MessageBox.error(err.message)
	} finally {
		btn_generate.disabled = false
		ui.pauseAutoSave(false)
		mask.close()
		mask = null
	}

}


async function Save(self, data) {
	const url = `/${Context.moduleName}/save`
	try {
		const result = await Module.apiCall(url, { data }) 
		return result 
	} catch (err) {
		throw err	
	} 
}

async function Generate(self, data, mask) {
	return new Promise(async (resolve, reject)=>{
		const jobId = Date.now()
		const clientId = `${Context.notifierId}-${jobId}`
		const notifierSocket = Context.notifierSocket
 		const ws = new WebSocket(`${notifierSocket}/?clientId=${clientId}`);
 
		ws.onmessage = (event) => {
			const data = JSON.parse(event.data);
			if (data.status === 'done') {
				ws.close();
				resolve(data);
			} else if (data.status=='error') {
				ws.close();
				reject(new Error(data.info.message))
			} else if (data.status=='message') {	
				console.log(data)
				mask.setText(data.info.message)
			} else if (data.status==='timeout') {
				ws.close();
				reject(new Error('generate timeout'));
			}
		};

		ws.onerror = (err) => {
			ws.close();
			console.error(err)
			reject(err);
		};


		const apiGen = new $fgta5.ApiEndpoint(`/${Context.moduleName}/generate`)
		try {
			const result = await apiGen.execute({ data, notifierSocket, clientId })
			console.log(result)

			// di sini tidak perlu resolve, karena resolve akan menunggu message dari websocket
		} catch (err) {
			reject(err)
		} finally {
			apiGen.dispose()
		}
	})
}
