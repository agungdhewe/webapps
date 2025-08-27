import Components from './appgen-components.mjs'
import AppGenIO from './appgen-io.mjs'

const IO = new AppGenIO()


const URL_LAYOUT = 'appgen-layout'
const ME = {}

const ENT_COL_ID =  'col_id'
const ENT_COL_NAME =  'col_name'
const ENT_COL_TITLE =  'col_title'
const ENT_COL_TABLE =  'col_table'
const ENT_COL_PK =  'col_pk'
const ENT_COL_BTNDESIGN =  'col_btndesign'
const ENT_COL_BTNREMOVE =  'col_btnremove'

const ATTR_NAME = 'name'
const ATTR_ENTITYID = 'data-entity-id'
const ATTR_DROPTARGET = 'drop-target'
const ATTR_DRAGOVER = 'data-dragover'
const ATTR_CURRENTENTITY = 'data-currententity'
const ATTR_COMPNAME = 'data-component-name'
const ATTR_ROWUNIQUE = 'data-rowuniqueindex'
const ATTR_ROWSEARCH = 'data-rowsearch'

const ID_ENTITYEDITOR = 'entity-editor'
const ID_DESIGNERINFO = 'designer-info'
const ID_DESIGNERSEARCH = 'designer-search'
const ID_DESIGNERUNIQ = 'designer-unique'
const ID_ICONTOOL = 'component-icon-tool'
const ID_DESIGNFIELD = 'design-data-field'

const CLS_HIDDEN = 'hidden'
const CLS_ENTITYEDITOR = 'entity-editor'



const DRAG_ICONTOOL = 'drag-icon-tool'
const DRAG_REORDERFIELD = 'drag-reorderfield'

/* icon default untuk program yang akan di generate, muncul di tombol [upload icon program] */
const ICON_DEFAULT = `<svg version="1.1" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<g fill="currentColor">
<path d="m20.019 2c-2.9332 0-5.2348 2.3057-5.2348 5.2389v3.1417h-8.3806c-2.3047 0-4.1903 1.8856-4.1903 4.1903v7.9628h3.1417c3.1427 0 5.6567 2.514 5.6567 5.6567 0 3.1427-2.514 5.6567-5.6567 5.6567h-3.3547v7.9628c0 2.3047 1.8856 4.1903 4.1903 4.1903h7.9628v-3.1458c0-3.1427 2.514-5.6567 5.6567-5.6567 3.1427 0 5.6567 2.514 5.6567 5.6567v3.1458h7.9628c2.3047 0 4.1903-1.8856 4.1903-4.1903v-8.3806h3.1417c2.9332 0 5.2389-2.3057 5.2389-5.2389 0-2.9332-2.3057-5.2389-5.2389-5.2389h-3.1417v-8.3806c0-2.3047-1.8856-4.1903-4.1903-4.1903h-8.3806v-3.1417c0.20951-2.9332-2.0968-5.2389-5.03-5.2389z"/>
</g>
</svg>`

const ICON_CLOSE = `<svg version="1.1" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <g stroke="currentColor" stroke-linecap="round" stroke-width="5">
	<path d="M4 4 L28 28"/>
	<path d="M4 28 L28 4"/>
  </g>
</svg>`

const ICON_PK = `<svg version="1.1" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
<g stroke-linecap="round" stroke-linejoin="round">
<rect x="11" y="8" width="26" height="32" fill="#fc0" stroke="#ffd42a" stroke-width="2"/>
<ellipse cx="23.333" cy="15.79" rx="8.6667" ry="4.2097" fill="none" stroke="#540" stroke-width="4"/>
<path d="m22 22.419v13.161" fill="none" stroke="#540" stroke-width="4"/>
<path d="m22 29.387h7.3333" fill="none" stroke="#540" stroke-width="4"/>
<path d="m22 35.581h10.667" fill="none" stroke="#540" stroke-width="4"/>
</g>
</svg>`


// let drop_valid = false

const CURRENT = {
	drag_action: null,
	drop_valid: false,
	entity_id: null,
	Design: null,
	droptarget: null
}


const generateId = (prefix = "el") => {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;
}
const isValidName = str => /^[_a-z0-9]+$/.test(str) ;

const capitalizeFirst = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const createInputElement = (type, entity_id, data={}) => {
	const input = document.createElement('input')
	input.setAttribute('type', type)
	input.setAttribute(ATTR_NAME, data.name)
	input.setAttribute(ATTR_ENTITYID, entity_id)
	input.value = data.value
	return input	
}

export default class AppGenUI {
	#app
	
	constructor(app) {
		this.#app = app
		
		IO.addFunction('addUnique', AppGenGenLayout_addUnique)
		IO.addFunction('addSearch', AppGenGenLayout_addSearch)
	}

	get App() { return this.#app}

	async NewData() {
		await AppGenLayout_NewData(this)
	}

	async Init() {
		await AppGenLayout_Render(this)
		AppGenLayout_NewData(this)
	}

	async getCurrentData() {
		return await IO.getCurrentData()
	}

	setCurrentId(id) {
		const obj_programid = document.getElementById('obj_programid')
		obj_programid.value = id
	}

	load(data) {
		IO.load(data)
	}

	pauseAutoSave(pause) {
		IO.pauseAutoSave(pause)
	}

	async updateCache() {
		IO.updateCache()
	}

	async reset() {
		await IO.reset()
	} 
}



async function AppGenLayout_Render(self) {
	ME.IconButton = document.getElementById('upload-icon') 
	ME.ComponentList = document.getElementById('crud-component-list')
	ME.DesignTemplate = document.getElementById('DESIGNTEMPLATE')
	ME.DataEntities = document.getElementById('data-entities')
	ME.EntityDesigner = document.getElementById('entities-design')
	ME.LayoutEditor = document.getElementById('layout-editor')
	ME.LayoutSidebar = document.getElementById('layout-sidebar')
	// ME.EntityDesigner = document.getElementById('entities-design')
	ME.tbl_entity = document.getElementById('tbl_entity')
	ME.btn_addEntity = document.getElementById('btn_addentity')
	ME.btn_addEntity.addEventListener('click', (evt)=>{
		btn_addEntity_click(self, evt)
	})

	AppGenLayout_createComponentList(this)
	AppGenLayout_createButtons(this)
	AppGenLayout_handleActionForm(this)

	
	IO.Setup({
		AddEntity: (data) => {
			AppGenLayout_AddEntity(self, data)
		},
		startDesign: (entity_id, suppress) => {
			AppGenLayout_startDesign(self, entity_id, suppress)
		},
		addComponentToDesigner: (droptarget, comp) => {
			return AppGenLayout_addComponentToDesigner(self, droptarget, comp) 
		},
		addAction: (data) => {
			AppGenLayout_addAction(self, data)
		}
		
	})
}

function AppGenLayout_createButtons(self) {
	// upload image icon
	ME.IconButton.style.backgroundImage = `url('data:image/svg+xml,${encodeURIComponent(ICON_DEFAULT)}')`;
	const btnUpload = document.getElementById('btn_IconUpload')
	btnUpload.addEventListener('change', (evt)=>{
		const file = btnUpload.files[0];
  		if (!file) return;

		const validTypes = ["image/png", "image/svg+xml"];
		if (!validTypes.includes(file.type)) {
			alert("Hanya file PNG atau SVG yang diperbolehkan.");
			return;
		}
		
		const reader = new FileReader();
  		reader.onload = function (e) {
			ME.IconButton.style.backgroundImage = `url('${e.target.result}')`
		};
 		reader.readAsDataURL(file);
	})


	//button design summary
	const btn_ShowSummary = document.getElementById('btn_ShowSummary')
	btn_ShowSummary.addEventListener('click', (evt)=>{
		btn_ShowSummary_click(self, evt)
	})

	// button design detil
	const btn_ShowDetail = document.getElementById('btn_ShowDetail')
	btn_ShowDetail.addEventListener('click', (evt)=>{
		btn_ShowDetail_click(self, evt)
	})


	// menampilkan design fields
	const btn_ShowFields = document.getElementById('btn_ShowFields')
	btn_ShowFields.addEventListener('click', (evt)=>{
		btn_ShowFields_click(self, evt)
	})

	// menampilkan design uniq
	const btn_ShowUniq = document.getElementById('btn_ShowUniq')
	btn_ShowUniq.addEventListener('click', (evt)=>{
		btn_ShowUniq_click(self, evt)
	})

	// menampilkan design search
	const btn_ShowSearch = document.getElementById('btn_ShowSearch')
	btn_ShowSearch.addEventListener('click', (evt)=>{
		btn_ShowSearch_click(self, evt)
	})
}

function btn_ShowSummary_click(self, evt) {
	CURRENT.Design.classList.add('design-view-as-summary')
	
	const entitties = CURRENT.Design.querySelectorAll('div[name="design-data-field"]')
	entitties.forEach(el=>{
		el.classList.remove('minimized')
		el.classList.remove('maximized')
	})

	const droptarget =  CURRENT.Design.querySelector('div[name="drop-target"')
	droptarget.classList.add('minimized-drop-target')
}

function btn_ShowDetail_click(self, evt) {
	CURRENT.Design.classList.remove('design-view-as-summary')
	const entitties = CURRENT.Design.querySelectorAll('div[name="design-data-field"]')
	entitties.forEach(el=>{
		el.classList.remove('minimized')
		el.classList.remove('maximized')
	})

	const droptarget =  CURRENT.Design.querySelector('div[name="drop-target"')
	droptarget.classList.remove('minimized-drop-target')
}

function showOnly(toShow) {
	var nodes = CURRENT.Design.children
	for (var node of nodes) {
		var name = node.getAttribute('name')
		if (toShow.includes(name)) {
			node.classList.remove('hidden')
		} else {
			node.classList.add('hidden')
		}
		
	}
}

function btn_ShowFields_click(self, evt) {
	showOnly(['designer-info', 'design-data-field'])

	// tampilkan kembali drop target
	const entity_id = CURRENT.entity_id
	const designer = ME.EntityDesigner.querySelector(`div[${ATTR_ENTITYID}="${entity_id}"]`)
	let droptarget = designer.querySelector(`[name="${ATTR_DROPTARGET}"]`)
	if (droptarget!=null) {
		droptarget.classList.remove('hidden')
	}
	
}

function btn_ShowUniq_click(self, evt) {
	showOnly(['designer-info', 'designer-unique'])
}

function btn_ShowSearch_click(self, evt) {
	showOnly(['designer-info', 'designer-search'])
}







function btn_addEntity_click(self, evt) {
	ME.btn_addEntity.style.animation = 'tombolDiTekanMenghilang 0.3s forwards'
	setTimeout(()=>{
		ME.btn_addEntity.classList.add('hidden')
		ME.btn_addEntity.style.animation = 'unset'
		AppGenLayout_AddEntity(self, {})
	}, 300)

	// nanti muncul lagi setelah 1 detil
	setTimeout(()=>{
		ME.btn_addEntity.classList.remove('hidden')
		ME.btn_addEntity.style.animation = 'tombolMunculLagi 0.3s forwards'
		setTimeout(()=>{
			ME.btn_addEntity.style.animation = 'unset'
		}, 300)
	}, 1000)
	

	

	
}

async function AppGenLayout_AddEntity(self, entity={}) {
	const ID = entity[ENT_COL_ID] ?? generateId('en')
	const tbl_entity = ME.tbl_entity
	const tbody = tbl_entity.querySelector('tbody')
	const cols = tbl_entity.querySelectorAll('thead > tr th')


	const newtr = document.createElement('tr')
	newtr.setAttribute(ATTR_ENTITYID, ID)

	if (entity.isheader) {
		newtr.setAttribute('data-isheader', '')
	}

	for (var th of cols) {
		const name = th.getAttribute(ATTR_NAME)
		const td = document.createElement('td')
		td.setAttribute(ATTR_NAME, name)
		newtr.appendChild(td)
	}
	tbody.appendChild(newtr)

	


	const fn_set_input = (type, value, entity_column_identity, isheader) => {
		const col = newtr.querySelector(`td[${ATTR_NAME}="${entity_column_identity}"]`)
		const data = {}
		data[`${ATTR_ENTITYID}`] = ID
		data[`${ATTR_NAME}`] = entity_column_identity
		data['value'] = value ?? ""
		const input = col.appendChild(createInputElement(type, ID, data))

		input.setAttribute('autocomplete', 'off')
		if (type=='text') {
			input.addEventListener('change', (evt)=>{
				AppGenLayout_entityInputChanged(self, evt)
			})
		}


		if (isheader===true) {
			type='hidden'
			input.setAttribute('type', 'hidden')
		} 
		if (type=='hidden') {
			col.innerHTML = `<span>${data['value']}</span>`
		}
		col.appendChild(input)
		return input
	}

	fn_set_input('hidden', ID, ENT_COL_ID, false)
	fn_set_input('text', entity[ENT_COL_NAME], ENT_COL_NAME, entity.isheader)
	fn_set_input('text', entity[ENT_COL_TITLE], ENT_COL_TITLE)
	fn_set_input('text', entity[ENT_COL_TABLE], ENT_COL_TABLE)
	fn_set_input('text', entity[ENT_COL_PK], ENT_COL_PK)
	
	let btn_design = fn_set_input('button', "design", ENT_COL_BTNDESIGN)
	btn_design.addEventListener('click', (evt)=>{
		btn_design_click(self, evt)
	})

	if (entity.isheader!==true) {
		let btn_remove = fn_set_input('button', "remove", ENT_COL_BTNREMOVE)
		btn_remove.addEventListener('click', (evt)=>{
			btn_remove_click(self, evt)
		})
	}



	// tambahkan ke ME.EntityDesigner
	AppGenLayout_addDesigner(self, ID, entity.isheader)
	

	return ID
}


async function AppGenLayout_entityInputChanged(self, evt) {
	const input = evt.target
	const name = input.getAttribute(ATTR_NAME)
	const entity_id = input.getAttribute(ATTR_ENTITYID)
	const value = input.value
	
	const data = {}
	data[name] = value

	const valid = await AppGenLayout_CekEntityData(self, data)
	if (valid) {
		AppGenLayout_changeEntityInfo(self, entity_id, data)
	}

	if (name==ENT_COL_PK) {
		AppGenLayout_designerFieldNameChanged(self, entity_id, input, true)
	}

}


async function AppGenLayout_CekEntityData(self, data) {
	for (var name in data) {
		if (data[name]==null || data[name].trim()=='') {
			await $fgta5.MessageBox.warning("lengkapi dahulu semua data entity")
			return false
		}
	}

	const rule = "hanya boleh alphabet dan angka, dengan huruf kecil,<br>tanpa spasi, tanpa character khusus."

	
	if (data[ENT_COL_NAME]!==undefined) {
		if (!isValidName(data[ENT_COL_NAME].trim())) {
			await $fgta5.MessageBox.warning(`nama entity: <span style="font-weight:bold; color:red">${data[ENT_COL_NAME]}</span> tidak valid!<br>${rule}`)
			return false
		}
	}

	/*
	if (data[ENT_COL_TABLE]!==undefined) {
		if (!isValidName(data[ENT_COL_TABLE].trim())) {
			await $fgta5.MessageBox.warning(`nama table: <span style="font-weight:bold; color:red">${data[ENT_COL_TABLE]}</span> tidak valid!<br>${rule}`)
			return false
		}
	}
	*/
	
	if (data[ENT_COL_PK]!==undefined) {
		if (!isValidName(data[ENT_COL_PK].trim())) {
			await $fgta5.MessageBox.warning(`nama PK: <span style="font-weight:bold; color:red">${data[ENT_COL_PK]}</span> tidak valid!<br>${rule}`)
			return false
		}
	}

	return true
}


async function btn_design_click(self, evt) {
	const btn = evt.target
	const entity_id = btn.getAttribute(ATTR_ENTITYID)
	const editores = ME.EntityDesigner.querySelectorAll(`div[name="${ID_ENTITYEDITOR}"]`)
	const tr = btn.closest('tr')
	
	
	const data = AppGenLayout_GetEntityData(self, tr)
	const valid = await AppGenLayout_CekEntityData(self, data)
	
	if (!valid) {
		return
	}

	for (let el of editores) {
		let ceid = el.getAttribute(ATTR_ENTITYID)
		if (ceid==entity_id) {
			el.classList.remove(CLS_HIDDEN)
			AppGenLayout_entityDesign(self, entity_id, tr)
			AppGenLayout_startDesign(self, entity_id)
		} else {
			el.classList.add(CLS_HIDDEN)
		}
	}
}


function AppGenLayout_GetEntityData(self, tr) {
	const ens = [ENT_COL_NAME, ENT_COL_TITLE, ENT_COL_TABLE, ENT_COL_PK]
	const data = {}

	for (var name of ens) {
		const obj = tr.querySelector(`td[name="${name}"] input`)
		data[name] = obj.value
	}

	return data
}


function AppGenLayout_entityDesign(self, entity_id, tr) {
	const data = AppGenLayout_GetEntityData(self, tr)
	AppGenLayout_changeEntityInfo(self, entity_id, data)

	// tandaii tool: ATTR_CURRENTENTITY
	let arr = Array.from(ME.ComponentList.children)
	for (let el of arr) {
		el.setAttribute(ATTR_CURRENTENTITY, entity_id)
	}
}


function AppGenLayout_changeEntityInfo(self, entity_id, data) {
	const info = ME.EntityDesigner.querySelector(`div[${ATTR_ENTITYID}="${entity_id}"] div[name="${ID_DESIGNERINFO}"]`)
	const ens = [ENT_COL_NAME, ENT_COL_TITLE, ENT_COL_TABLE, ENT_COL_PK]
	for (var name of ens) {
		if (data[name]!==undefined) {
			const ed = info.querySelector(`div[name="${name}"]`)
			ed.innerHTML = data[name]
		}
	}
}


async function btn_remove_click(self, evt) {
	const btn = evt.target
	const tr = btn.closest('tr')
	const data = AppGenLayout_GetEntityData(self, tr)

	var sudahadadata = false
	for (var name in data) {
		if (data[name].trim()!='') {
			sudahadadata = true
		}
	}

	const remove = (tr) => {
		var entity_id = tr.getAttribute(ATTR_ENTITYID)
		var editor = ME.EntityDesigner.querySelector(`[${ATTR_ENTITYID}="${entity_id}"]`) 
		if (editor!=null) {
			editor.remove()
		}
		tr.remove()
	}


	if (sudahadadata) {
		var ret = await $fgta5.MessageBox.confirm("Apakah anda yakin mau menghapus design entity ini?")
		if (ret=='ok') {
			remove(tr)
		}
	} else {
		remove(tr)
	}


}


function AppGenLayout_addDesigner(self, ID, isheader) {

	const editem = document.createElement('div')
	editem.classList.add('hidden')
	editem.classList.add(CLS_ENTITYEDITOR)
	editem.setAttribute('name', ID_ENTITYEDITOR)
	editem.setAttribute(ATTR_ENTITYID, ID)
	
	// ambil data template untuk entity info
	const tplInfo = ME.DesignTemplate.querySelector(`div[name="${ID_DESIGNERINFO}"]`)
	const elinfo = tplInfo.cloneNode(true)

	// ambil data template uniq design
	const tplUniq = ME.DesignTemplate.querySelector(`div[name="${ID_DESIGNERUNIQ}"]`)
	const eluniq = tplUniq.cloneNode(true)

	// ambil data template uniq search
	const tplSearch = ME.DesignTemplate.querySelector(`div[name="${ID_DESIGNERSEARCH}"]`)
	const elsearch = tplSearch.cloneNode(true)


	
	// console.log(ME.EntityDesigner)
	// eluniq.innerHTML = `designer unig ${ID}` 


	
	editem.appendChild(elinfo)
	editem.appendChild(eluniq)
	editem.appendChild(elsearch)

	const chka = elinfo.querySelector('input[type="checkbox"][name="allow-row-add"]')
	const chkr = elinfo.querySelector('input[type="checkbox"][name="allow-row-remove"]')

	chka.checked = true
	chkr.checked = true

	if (isheader===true) {
		chka.disabled = true
		chkr.disabled = true
		const dcs = elinfo.querySelectorAll('[data-control]')
		for (var dc of dcs) {
			dc.classList.add('hidden')
		}

	} else {
		const dai = elinfo.querySelectorAll('[data-autoid]')
		for (var ai of dai) {
			ai.classList.add('hidden')
		}
	}

	// setup designer uniq & search
	AppGenGenLayout_setupUniqueDesigner(eluniq, ID)
	AppGenGenLayout_setupSearchDesigner(elsearch, ID)

	// tambahkan editor ke designer
	ME.EntityDesigner.appendChild(editem)
}


function AppGenGenLayout_setupUniqueDesigner(eluniq, entity_id) {
	const tbl = eluniq.querySelector('table[name="tbl-unique"]')
	const btnAdd = eluniq.querySelector('button[name="btnAdd"]')
	const trLineAdd = btnAdd.closest('tr')
	
	tbl.setAttribute(ATTR_ENTITYID, entity_id)
	btnAdd.setAttribute(ATTR_ENTITYID, entity_id)
	trLineAdd.setAttribute(ATTR_ENTITYID, entity_id)
	
	btnAdd.addEventListener('click', AppGenGenLayout_addUniqueButtonClick)

}

function AppGenGenLayout_addUnique(data, entity_id) {
	const tbl = ME.EntityDesigner.querySelector(`table[name="tbl-unique"][${ATTR_ENTITYID}="${entity_id}"`)
	const btn = tbl.querySelector('button[name="btnAdd"]')
	const tr = btn.closest('tr')


	const uniq_name = data.uniq_name
	const uniq_fields = data.uniq_fields

	// tambahkan unique
	const newRow = document.createElement('tr')
	const tdName = document.createElement('td')
	const tdFields = document.createElement('td')
	const tdControl = document.createElement('td')
	const btnRemove = document.createElement('div')
	btnRemove.classList.add('action-button-remove')
	btnRemove.innerHTML = ICON_CLOSE
	btnRemove.addEventListener('click', AppGenGenLayout_removeUniqueButtonClick)

	tdName.innerHTML = uniq_name
	tdName.setAttribute('data-name', 'name')

	tdFields.innerHTML = uniq_fields
	tdFields.setAttribute('data-name', 'fields')

	tdControl.appendChild(btnRemove)

	newRow.appendChild(tdName)
	newRow.appendChild(tdFields)
	newRow.appendChild(tdControl)

	newRow.setAttribute(ATTR_ENTITYID, entity_id)
	newRow.setAttribute(ATTR_ROWUNIQUE, '')

	tr.parentNode.insertBefore(newRow, tr);
}

function AppGenGenLayout_addUniqueButtonClick(evt) {
	const tr = evt.target.closest('tr')
	const entity_id = tr.getAttribute(ATTR_ENTITYID)
	const elName = tr.querySelector('input[name="unique_name"]')
	const elFields = tr.querySelector('input[name="unique_fields"]')
	
	const data = {
		uniq_name: elName.value,
		uniq_fields: elFields.value
	}
	AppGenGenLayout_addUnique(data, entity_id)

		// reset
	elName.value = ''
	elFields.value = ''
}

async function AppGenGenLayout_removeUniqueButtonClick(evt) {
	var res = await $fgta5.MessageBox.confirm('removing item is irreversible. Are you sure ?')
	if (res=='ok') {
		const btn = evt.target
		const tr = evt.target.closest('tr')
		tr.remove()
	}
}


function AppGenGenLayout_setupSearchDesigner(elsearch, entity_id) {
	const tbl = elsearch.querySelector('table[name="tbl-search"]')
	const btnAdd = elsearch.querySelector('button[name="btnAdd"]')
	const trLineAdd = btnAdd.closest('tr')
	
	tbl.setAttribute(ATTR_ENTITYID, entity_id)
	btnAdd.setAttribute(ATTR_ENTITYID, entity_id)
	trLineAdd.setAttribute(ATTR_ENTITYID, entity_id)
	
	btnAdd.addEventListener('click', AppGenGenLayout_addSearchButtonClick)

}

function AppGenGenLayout_addSearchButtonClick(evt) {
	const tr = evt.target.closest('tr')
	const entity_id = tr.getAttribute(ATTR_ENTITYID)
	const elName = tr.querySelector('input[name="criteria_name"]')
	const elLabel = tr.querySelector('input[name="criteria_label"]')
	const elFields = tr.querySelector('input[name="criteria_fields"]')
	
	const data = {
		criteria_name: elName.value,
		criteria_label: elLabel.value,
		criteria_fields: elFields.value
	}
	AppGenGenLayout_addSearch(data, entity_id)

		// reset
	elName.value = ''
	elLabel.value = ''
	elFields.value = ''
}

async function AppGenGenLayout_removeSearchButtonClick(evt) {
	var res = await $fgta5.MessageBox.confirm('removing item is irreversible. Are you sure ?')
	if (res=='ok') {
		const btn = evt.target
		const tr = evt.target.closest('tr')
		tr.remove()
	}
}

function AppGenGenLayout_addSearch(data, entity_id) {
	const tbl = ME.EntityDesigner.querySelector(`table[name="tbl-search"][${ATTR_ENTITYID}="${entity_id}"`)
	const btn = tbl.querySelector('button[name="btnAdd"]')
	const tr = btn.closest('tr')

	const criteria_name = data.criteria_name
	const criteria_label = data.criteria_label
	const criteria_fields = data.criteria_fields

	// tambahkan unique
	const newRow = document.createElement('tr')
	const tdName = document.createElement('td')
	const tdLabel = document.createElement('td')
	const tdFields = document.createElement('td')
	const tdControl = document.createElement('td')
	const btnRemove = document.createElement('div')
	btnRemove.classList.add('action-button-remove')
	btnRemove.innerHTML = ICON_CLOSE
	btnRemove.addEventListener('click', AppGenGenLayout_removeSearchButtonClick)

	tdName.innerHTML = criteria_name
	tdName.setAttribute('data-name', 'name')

	tdLabel.innerHTML = criteria_label
	tdLabel.setAttribute('data-name', 'label')

	tdFields.innerHTML = criteria_fields
	tdFields.setAttribute('data-name', 'fields')

	tdControl.appendChild(btnRemove)


	newRow.appendChild(tdName)
	newRow.appendChild(tdLabel)
	newRow.appendChild(tdFields)
	newRow.appendChild(tdControl)

	newRow.setAttribute(ATTR_ENTITYID, entity_id)
	newRow.setAttribute(ATTR_ROWUNIQUE, '')

	tr.parentNode.insertBefore(newRow, tr);
}


async function AppGenLayout_NewData(self) {

	// jika belum ada header
	const tbl_entity = ME.tbl_entity
	const tbody = tbl_entity.querySelector('tbody')
	const entity_id = await AppGenLayout_AddEntity(self, {
		isheader: true,
		col_name: 'header',
		col_title: 'test_title',
		col_table: 'test_table',
		col_pk: 'test_pk'
	})

	const btn = tbody.querySelector(`[name="col_btndesign"][${ATTR_ENTITYID}="${entity_id}"]`)
	btn.click()
	
	setTimeout(()=>{
		IO.AutoSave()
	}, 2000)

}


function AppGenLayout_highlightElement(self, droptarget) {


	droptarget.style.animation = 'pulseHighlight 1s forwards'
	setTimeout(()=>{
		droptarget.style.animation = 'unset'
	}, 1000)

}

function AppGenLayout_startDesign(self, entity_id, suppress) {
	if (suppress===undefined) {
		suppress = false
	}	


	if (!suppress) {
		ME.LayoutEditor.classList.remove('hidden')
		ME.LayoutSidebar.classList.remove('hidden')
	}


	// buat drop target
	// cek apakah sudah ada drop target
	const designer = ME.EntityDesigner.querySelector(`div[${ATTR_ENTITYID}="${entity_id}"]`)
	let droptarget = designer.querySelector(`[name="${ATTR_DROPTARGET}"]`)
	if (droptarget==null) {
		// blum ada, buat dulu
		const tpl = ME.DesignTemplate.querySelector(`div[name="${ATTR_DROPTARGET}"]`)
		droptarget = tpl.cloneNode(true)
		droptarget.setAttribute(ATTR_ENTITYID, entity_id)
		designer.appendChild(droptarget)
	}

	// scroll ke element editor
	designer.scrollIntoView({
		behavior: 'smooth',
		block: 'start'
	});

	AppGenLayout_setupDropTarget(self, droptarget)

	// higlight drop target
	AppGenLayout_highlightElement(self, droptarget)

	CURRENT.entity_id = entity_id
	CURRENT.Design = designer
	CURRENT.droptarget = droptarget

}

function AppGenLayout_setupDropTarget(self, droptarget) {
	const dr = droptarget.getAttribute(ATTR_DROPTARGET)
	if (dr===true) {
		// drop target sudah di setup
		return
	}


	droptarget.addEventListener('dragover', (evt)=>{
		evt.preventDefault()
		droptarget.setAttribute(ATTR_DRAGOVER, '')
	})

	droptarget.addEventListener('dragleave', (evt)=>{
		droptarget.removeAttribute(ATTR_DRAGOVER)
		// droptarget.classList.add('hidden')
	})

	droptarget.addEventListener('drop', (evt)=>{
		CURRENT.drop_valid = true
		droptarget.removeAttribute(ATTR_DRAGOVER)

		
		if (CURRENT.drag_action==DRAG_ICONTOOL) {
			const compname = evt.dataTransfer.getData('compname');
			AppGenLayout_addComponentToDesigner(self, droptarget, Components[compname])

			setTimeout(()=>{
				CURRENT.Design.appendChild(droptarget)
				droptarget.scrollIntoView({
					behavior: 'smooth',
					block: 'start'
				});
			}, 300)

		} else if (CURRENT.drag_action==DRAG_REORDERFIELD) {
			const datafield_id =  evt.dataTransfer.getData('datafield_id');
			const el = document.getElementById(datafield_id)
			droptarget.after(el)
			setTimeout(()=>{
				droptarget.classList.add('hidden')
			}, 300)
		}  

		CURRENT.drag_action = ''
		

	})
	
}


function AppGenLayout_createComponentList(self) {
	const tpl = ME.DesignTemplate.querySelector(`div[name="${ID_ICONTOOL}"]`)
	for (var name in Components) {
		let comp = Components[name]

		comp.name = name
		var iconTool = AppGenLayout_createIconTool(self, comp, tpl)
		ME.ComponentList.appendChild(iconTool)
	}

}

function AppGenLayout_createIconTool(self, comp, tpl) {
	const tool = tpl.cloneNode(true)
	const icon = tool.querySelector('div[data-icon')
	const label = tool.querySelector('div[data-label]')
	
	
	icon.innerHTML =comp.icon
	label.innerHTML = comp.title


	tool.addEventListener('dragstart', (evt)=>{
		CURRENT.drop_valid = false
		CURRENT.drag_action = DRAG_ICONTOOL
		evt.dataTransfer.setData('compname', comp.name);
	})

	tool.addEventListener('dragend', (evt)=>{
		if (CURRENT.droptarget==null) {
			return
		}
		const fields = CURRENT.Design.querySelectorAll('[name="design-data-field"]')
		if (fields.length==0) {
			return
		}
		if (!CURRENT.drop_valid) {
			CURRENT.droptarget.classList.add('hidden')
		}
	})

	tool.addEventListener('dblclick', (evt)=>{
		// pindah drop target ke bawah
		// droptarget.classList.remove('hidden')
		CURRENT.droptarget.classList.remove('hidden')
		CURRENT.Design.appendChild(CURRENT.droptarget)
		AppGenLayout_addComponentToDesigner(self, CURRENT.droptarget, comp)
		
		// terus sroll ke bawah
		setTimeout(()=>{
			CURRENT.droptarget.scrollIntoView({
				behavior: 'smooth',
				block: 'start'
			});
		}, 300)
	})

	return tool
}


function AppGenLayout_addComponentToDesigner(self, droptarget, comp) {
	const tpl = ME.DesignTemplate.querySelector(`div[name="${ID_DESIGNFIELD}"][data-template=${comp.template}]`)
	const datafield = tpl.cloneNode(true)
	const entity_id = droptarget.getAttribute(ATTR_ENTITYID)

	const datafield_id = generateId('datafield')
	datafield.setAttribute('id', datafield_id)
	datafield.setAttribute(ATTR_ENTITYID, entity_id)
	datafield.setAttribute(ATTR_COMPNAME, comp.name)

	// masukkan element baru sebelum drop target
	droptarget.before(datafield)


	// setup datafiled
	const comptype = datafield.querySelector('[name="component-type"]')
	
	const compicon = comptype.querySelector('[name="icon"]')
	const comptitle = comptype.querySelector('[name="title"]')
	comptitle.innerHTML = comp.title

	const compsummary = datafield.querySelector('[name="component-summary"]')
	const compiconsummary = compsummary.querySelector('[name="icon"]')

	const compiconspk = datafield.querySelectorAll('[name="icon-pk"]')
	for (var iconspk of compiconspk) {
		iconspk.setAttribute(ATTR_ENTITYID, entity_id)
	}

	compsummary.setAttribute('draggable', true)
	compsummary.addEventListener('dragstart', (evt)=>{
		CURRENT.drop_valid = false
		CURRENT.drag_action = DRAG_REORDERFIELD
		evt.dataTransfer.setData('datafield_id', datafield_id);
	})
	compsummary.addEventListener('dragend', (evt)=>{
		if (CURRENT.droptarget==null) {
			return
		}
		if (!CURRENT.drop_valid) {
			CURRENT.droptarget.classList.add('hidden')
		}
	})



	// copy icon dari detil design ke summary design
	compiconsummary.innerHTML = compicon.innerHTML



	const obj_namesummary = datafield.querySelector('input[name="fieldname-summary"]')
	obj_namesummary.addEventListener('dblclick', (evt)=>{ 
		evt.stopPropagation() // mencegar trigger maximize/minimized saat dblclick textbox
	})

	// kalau data field dilewati DRAG ICON, munculkan droptarget di bawahnya
	datafield.addEventListener('dragover', (evt)=>{
		if (CURRENT.drag_action==DRAG_ICONTOOL || CURRENT.drag_action==DRAG_REORDERFIELD) {
			evt.preventDefault()
			droptarget.classList.remove('hidden')

			const rect = datafield.getBoundingClientRect();
  			const offsetY = evt.clientY - rect.top;
			const offsetX = evt.clientX - rect.left;

			if (offsetX > rect.width - 100) {
				return;
			}
			

			if (offsetY < rect.height / 2) {
				setTimeout(()=>{
					datafield.before(droptarget)
				}, 300)
				
			} else {
				setTimeout(()=>{
					datafield.after(droptarget)
				}, 300)
			}

		}
	})

	// handle button close
	const btncs = datafield.querySelectorAll(`[class="field-remove-button"]`)
	for (const btn of btncs) {
		btn.innerHTML = ICON_CLOSE
		btn.addEventListener('click', async (evt)=>{
			var res = await $fgta5.MessageBox.confirm('removing field is irreversible. Are you sure ?')
			if (res=='ok') {
				// hapus
				datafield.style.animation = 'fieldDihapus 0.3s forwards'
				setTimeout(()=>{
					datafield.remove()
				}, 300)
			}
		})
	}


	const bars = datafield.querySelectorAll("div[field-handle-bar]")
	for (let bar of bars) {
		bar.addEventListener('dblclick', (evt)=>{
			const varname = bar.getAttribute('name')
			if (varname=='component-summary') {
				datafield.classList.add('maximized')
				datafield.classList.remove('minimized')
			} else {
				datafield.classList.add('minimized')
				datafield.classList.remove('maximized')
			}
		})
	}

	AppGenGenLayout_HandleDataField(self, entity_id, comp, datafield) 


	return datafield
}	


function AppGenLayout_designerFieldNameChanged(self, entity_id, obj, fromentity) {
	const query = `tr[${ATTR_ENTITYID}="${entity_id}"] [name="${ENT_COL_PK}"] input`
	const elpk = ME.DataEntities.querySelector(query)


	
	const setPk = (df, primary_key) => {
		// reset seluruh primary key
		const alliconspk = df.querySelectorAll('[name="icon-pk"]')
		for (var icoalpk of alliconspk) {
			icoalpk.innerHTML = ''
		}
		
		const field = df.querySelector(`input[name="fieldname"][${ATTR_ENTITYID}="${entity_id}"]`)
		const current_fieldname_value = field.value
		if (current_fieldname_value==primary_key) {
			const iconspk = df.querySelectorAll(`[name="icon-pk"][${ATTR_ENTITYID}="${entity_id}"]`)
			for (var ico of iconspk) {
				ico.innerHTML = ICON_PK
			}

		}
	}



	let primary_key
	if (fromentity===true) {
		// diedit dari tabel entity
		primary_key = obj.value

		// cari semua field dengan valuenya primary_key
		const design = ME.EntityDesigner.querySelector(`[name="entity-editor"][${ATTR_ENTITYID}="${entity_id}"]`)
		const dfs = design.querySelectorAll('[name="design-data-field"]')
		for (const df of dfs) {
			setPk(df, primary_key)
		}
	} else {
		// diedit dari designer
 		primary_key = elpk.value
		const df = obj.closest('[name="design-data-field"]') //cari [name="design-data-field"] terdekat
		setPk(df, primary_key)
	}
}

function AppGenLayout_handleActionForm(self) {
	const btn_action_add = document.getElementById('btn_action_add')
	btn_action_add.addEventListener('click', (evt)=>{
		const txt_action_name = document.getElementById('txt_action_name')
		const txt_action_title = document.getElementById('txt_action_title')
		const txt_action_permission = document.getElementById('txt_action_permission')

		AppGenLayout_addAction(self, {
			name: txt_action_name.value,
			title: txt_action_title.value,
			permission: txt_action_permission.value
		})
	})
}

async function AppGenLayout_addAction(self, data) {
	const tbody = document.getElementById('action-lists')	
	const name = data.name
	const title = data.title
	const permission = data.permission ?? ''

	if (!isValidName(name)) {
		await $fgta5.MessageBox.warning('nama action tidak valid')
		return
	}

	if (title.trim()=='') {
		await $fgta5.MessageBox.warning('title tidak valid')
		return
	}


	const tr = document.createElement('tr')
	const tdName = document.createElement('td')
	const tdTitle = document.createElement('td')
	const tdPermission = document.createElement('td')
	const tdButton = document.createElement('td')
	const rmButton = document.createElement('div')
	

	tdName.innerHTML = `<div name="action-name" class="action-cell">${name}</div>`
	tdTitle.innerHTML = `<div name="action-title" class="action-cell">${title}</div>`
	tdPermission.innerHTML = `<div name="action-title" class="action-cell">${permission}</div>`

	rmButton.innerHTML = ICON_CLOSE
	rmButton.classList.add("action-button-remove")
	rmButton.addEventListener('click', async (evt)=>{
		var res = await $fgta5.MessageBox.confirm('Are you sure removing this action ?')
		if (res=='ok') {
			tr.remove()
		}
	})
	
	tdButton.appendChild(rmButton)


	tr.appendChild(tdName)
	tr.appendChild(tdTitle)
	tr.appendChild(tdPermission)
	tr.appendChild(tdButton)
	tbody.appendChild(tr)

	txt_action_name.value = ''
	txt_action_title.value = ''
	txt_action_permission.value = ''
}

function AppGenGenLayout_HandleDataField(self, entity_id, comp, datafield) {
	const fieldname = datafield.querySelector('input[name="fieldname"]')
	const namesummary = datafield.querySelector('input[name="fieldname-summary"]')
	const objectname  = datafield.querySelector('input[name="objectname"]')
	const labeltext = datafield.querySelector('input[name="labeltext"]')
	const placeholder = datafield.querySelector('input[name="placeholder"]')
	

	
	
	const nameChanged = (value) => {
		if (objectname.value.trim()=='') {
			objectname.value = 'obj_' + fieldname.value
		}

		if (labeltext.value.trim()=='') {
			labeltext.value = capitalizeFirst(fieldname.value)
		}

		if (placeholder.value.trim()=='') {
			placeholder.value = fieldname.value
		}
	}

	const nameKeydown = (evt) => {
		const allowed = /^[a-zA-Z0-9_]$/; // hanya huruf, angka, dan underscore

		if (
			evt.ctrlKey || evt.metaKey || evt.altKey || // biarkan shortcut seperti Ctrl+C
			evt.key === "Backspace" ||
			evt.key === "Tab" ||
			evt.key === "ArrowLeft" ||
			evt.key === "ArrowRight" ||
			evt.key === "Delete"
		) {
			return; // izinkan navigasi dan kontrol
		}

		if (!allowed.test(evt.key)) {
			evt.preventDefault(); // blokir karakter lain
		}
	}
	

	fieldname.setAttribute(ATTR_ENTITYID, entity_id)
	fieldname.addEventListener('change', (evt)=>{ 
		namesummary.value = fieldname.value 
		const entity_id = fieldname.getAttribute(ATTR_ENTITYID)
		AppGenLayout_designerFieldNameChanged(self, entity_id, fieldname)
		nameChanged(fieldname.value)
	})

	
	namesummary.setAttribute(ATTR_ENTITYID, entity_id)
	namesummary.addEventListener('change', (evt)=>{ 
		fieldname.value = namesummary.value 
		const entity_id = namesummary.getAttribute(ATTR_ENTITYID)
		AppGenLayout_designerFieldNameChanged(self, entity_id, namesummary)
		nameChanged(namesummary.value)
	})


	fieldname.addEventListener('keydown', (evt)=>{
		nameKeydown(evt)
	}); 

	namesummary.addEventListener('keydown', (evt)=>{
		nameKeydown(evt)
	});


	if (comp.name=='Textbox') {
		const datalength = datafield.querySelector('input[name="datalength"]')
		const maximum = datafield.querySelector('input[name="maximum"]')
		maximum.value = datalength.value
		datalength.addEventListener('change', (evt)=>{
			maximum.value = datalength.value
		})

	}

}