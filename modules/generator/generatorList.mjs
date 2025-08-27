import Context from './generator-context.mjs'
import * as Extender from './generator-ext.mjs'


const Crsl =  Context.Crsl
const CurrentSectionId = Context.Sections.generatorList
const CurrentSection = Crsl.Items[CurrentSectionId]
const CurrentState = {}

const tbl =  new $fgta5.Gridview('generatorList-tbl')
const pnl_search = document.getElementById('generatorList-pnl_search')
const btn_gridload = new $fgta5.ActionButton('generatorList-btn_gridload') 

export const Section = CurrentSection
export const SearchParams = {}

export async function init(self, args) {
	console.log('initializing generatorList ...')

	// add event listener
	tbl.addEventListener('nextdata', async evt=>{ tbl_nextdata(self, evt) })
	tbl.addEventListener('sorting', async evt=>{ tbl_sorting(self, evt) })
	tbl.addEventListener('cellclick', async evt=>{ tbl_cellclick(self, evt) })
	tbl.addEventListener('celldblclick', async evt=>{ tbl_celldblclick(self, evt) })

	btn_gridload.addEventListener('click', async evt=>{ btn_gridload_click(self, evt) })
	

	try {
		// extract custom search panel from template
		const tplSearchPanel = document.querySelector('template[name="custom-search-panel"]')
		if (tplSearchPanel!=null) {
			const clone = tplSearchPanel.content.cloneNode(true); // salin isi template
			pnl_search.prepend(clone)
		}
		
		// setup search panel
		const cmps = pnl_search.querySelectorAll('[fgta5-component][binding')
		for (var cmp of cmps) {
			var id = cmp.getAttribute('id')
			var componentname = cmp.getAttribute('fgta5-component')
			var binding = cmp.getAttribute('binding')
			SearchParams[binding] =  new $fgta5[componentname](id)
		}

		// generator-ext.mjs, export function initSearchParams(self, SearchParams) {} 
		// jangan exekusi langsung dari generatorExtender, karena akan error saat di rollup
		if (typeof Extender.initSearchParams === 'function') {
			Extender.initSearchParams(self, SearchParams)
		} else {
			console.warn(`'initSearchParams' tidak diimplementasikan di extender`)
		}
		
	} catch (err) {
		throw err
	} finally {
		// load data
		if (args.autoLoadGridData===true) {
			loadData(self)
		}
	}


}

export async function render(self) {
	console.log('generatorList render')
}


export async function loadData(self) {
	await tbl.clear()
	tbl_loadData(self)
}

export function getCurrentRow(self) {
	return CurrentState.SelectedRow
}

function setCurrentRow(self, tr) {
	CurrentState.SelectedRow = tr
}

export function addNewRow(self, data) {
	const tr = tbl.addRow(data)
	setCurrentRow(self, tr)
}

export function updateCurrentRow(self, data) {
	const tr = CurrentState.SelectedRow

	try {
		tbl.updateRow(tr, data)
	} catch (err) {
		throw err
	}
}

export function removeCurrentRow(self) {
	const tr = CurrentState.SelectedRow
	tr.remove()
}

export function selectNextRow(self) {
	const tr = CurrentState.SelectedRow
	if (tr.nextElementSibling) {
		openRow(self, tr.nextElementSibling)
	}
}

export function selectPreviousRow(self) {
	const tr = CurrentState.SelectedRow
	if (tr.previousElementSibling) {
		openRow(self, tr.previousElementSibling)
	}
}


async function openRow(self, tr) {
	const keyvalue = tr.getAttribute('keyvalue')
	const key = tr.getAttribute('key')

	const generatorEdit = self.Modules.generatorEdit

	try {
		setCurrentRow(self, tr)
		CurrentState.SelectedRow.keyValue = keyvalue
		CurrentState.SelectedRow.key = key
		await generatorEdit.openSelectedData(self, {key:key, keyvalue:keyvalue})
	} catch (err) {
		console.error(err)
		await $fgta5.MessageBox.error(err.message)

		setCurrentRow(self, null)
		CurrentSection.show() // kembalikan ke list kalau error saat buka data
	}
}


async function tbl_nextdata(self, evt) {
	const criteria = evt.detail.criteria
	const limit = evt.detail.limit
	const offset = evt.detail.nextoffset
	const sort = evt.detail.sort

	await tbl_loadData(self, {criteria, limit, offset, sort})
	tbl.scrollToFooter()
}

async function tbl_sorting(self, evt) {
	tbl.clear()
	const sort = evt.detail.sort
	const criteria = evt.detail.Criteria
	tbl_loadData(self, {criteria, sort})
}

async function tbl_cellclick(self, evt) {
	if (Module.isMobileDevice()) {
		await tbl_celldblclick(self, evt)
	}
}

async function tbl_celldblclick(self, evt) {
	const tr = evt.detail.tr

	const generatorEdit = self.Modules.generatorEdit
	generatorEdit.Section.show()

	await openRow(self, tr)
}

async function btn_gridload_click(self, evt) {
	setCurrentRow(self, null)
	loadData(self)
}


async function tbl_loadData(self, params={}) {
	console.log('loading generator data')
	console.log(params)

	const { criteria={}, limit=0, offset=0, sort={} } = params

	// isi criteria
	for (var key in SearchParams) {
		var cmp = SearchParams[key]
		var valid = cmp.validate()
		if (!valid) {
			console.error('ada yang belum diisi')
			return false
		}
		criteria[key] = SearchParams[key].value
	}

	// cek sorting
	if (sort===undefined) {
		sort = tbl.getSort()
	}

	const args = {
		columns: ['generator_id', 'generator_appname', 'generator_modulename'],
		criteria: criteria,
		offset: offset,
		limit: limit,
		sort: sort		
	}

	let mask = $fgta5.Modal.createMask()

	const apiList = new $fgta5.ApiEndpoint('/generator/list')
	try {
		const result = await apiList.execute(args)

		// jika offset tidak didefinisikan, berarti start dari awal, table dikosongkan dahulua
		// jika offset didefinisikan berarti request untuk halaman berikutnya
		if (offset===undefined) {
			tbl.clear()
		}
		tbl.addRows(result.data)
		tbl.setNext(result.nextoffset, result.limit)

	} catch (err) {
		console.error(err)
		$fgta5.MessageBox.error(err.message)
	} finally {
		apiList.dispose()
		mask.close()
		mask = null
	}
	
}