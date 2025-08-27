import Components from './appgen-components.mjs'

const btn = {}
const ATTR_ENTITYID = 'data-entity-id'
const ATTR_COMPNAME = 'data-component-name'
const ATTR_ROWUNIQUE = 'data-rowuniqueindex'
const ATTR_ROWSEARCH = 'data-rowsearch'


const Context = {}

const isValidName = str => /^[_a-z0-9]+$/.test(str) ;

const timestamp = () => {
  const now = new Date();
  const YYYY = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, "0");
  const DD = String(now.getDate()).padStart(2, "0");
  const HH = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const SS = String(now.getSeconds()).padStart(2, "0");
  return `${YYYY}${MM}${DD}${HH}${mm}${SS}`;
}

export default class AppGenIO {
	Setup(config) {
		AppGenIO_Setup(this, config)
	}
	

	AutoSave() {
		AppGenIO_AutoSave(this)
	}

	GetDataFromCache() {
		return AppGenIO_GetDataFromCache(this)
	}

	ReadData(content) {
		AppGenIO_ReadData(this, content)
	}

	// cek AppGenIO_Setup untuk ovveride fungsi2 di bawah
	AddEntity(data) {} // ini nanti di ovveride saat setup
	startDesign(entity_id) {}


	#autoSavePaused = false
	get autoSavePaused() { return this.#autoSavePaused }
	pauseAutoSave(autoSavePaused) {
		console.log(autoSavePaused? 'auto save paused' : 'auto save resume')
		this.#autoSavePaused = autoSavePaused
	}

	async getCurrentData() {
		const data = await AppGenIO_GetCurrentWorkData(this)
		return data
	}

	async updateCache() {
		var data = await AppGenIO_GetCurrentWorkData(self)
		AppGenIO_updateCache(data)
	}

	async reset() {
		await AppGenIO_Reset(this)
	}

	load(data) {
		AppGenIO_Load(this, data)
	}


	addFunction(fnName, fn) {
		Context[fnName] = fn
	}

}




function getValueFrom(datafield, query, propertyname) {
	var el = datafield.querySelector(query)
	if (el==null) {
		return null
	}
	if (el[propertyname]===undefined) {
		return null
	} 
	return el[propertyname]
}

function getCheckedFrom(datafield, query) {
	var el = datafield.querySelector(query)
	if (el==null) {
		return false
	}

	return el.checked===true ? true : false
}

function setValueTo(value, datafield, query, propertyname) {
	var el = datafield.querySelector(query)
	if (el==null) {
		return null
	}
	if (el[propertyname]===undefined) {
		return null
	} 
	el[propertyname] = value
}

function setCheckedTo(checked, datafield, query) {
	var el = datafield.querySelector(query)
	if (el==null) {
		return false
	}
	el.checked = checked
}

function setSelectedTo(value, datafield, query) {
	var el = datafield.querySelector(query)
	if (el==null) {
		return false
	}

	for (let option of el.options) {
		if (option.value === value) {
			option.selected = true;
			break;
		}
	}

}



function AppGenIO_Setup(self, config) {
	self.AddEntity = config.AddEntity
	self.startDesign = config.startDesign
	self.addComponentToDesigner = config.addComponentToDesigner
	self.addAction = config.addAction


	btn.save = document.getElementById('btnAppGenSave')
	btn.save.addEventListener('click', async (evt)=>{

		const data = await AppGenIO_GetCurrentWorkData(self)
		const suggestedName = data.name
		const handle = await window.showSaveFilePicker({
			suggestedName,
			types: [
			{
				description: "JSON File",
				accept: { "application/json": [".json"] },
			},
			],
		});

		
		const writable = await handle.createWritable();
  		await writable.write(JSON.stringify(data, null, 2)); // prettify JSON
  		await writable.close();

		// AppGenIO_Save(self, evt)
	})



	btn.load = document.getElementById('btnAppGenLoad')
	btn.load.addEventListener('click', (evt)=>{
		const input = document.createElement("input");
		input.type = "file";
		input.accept = ".json"; // opsional: filter ekstensi
		input.style.display = "none"; // tidak perlu ditambahkan ke dokumen
		
		input.addEventListener("change", () => {
			if (input.files.length > 0) {
				const file = input.files[0]
				if (!file) return;
				
				const reader = new FileReader();
				reader.onload = function (e) {
					const content = e.target.result;
					AppGenIO_ReadData(self, content)
				};
				reader.readAsText(file); 
			}
		});

		input.click(); // harus dalam content clikc user
	})
}

function AppGenIO_GetDataFromCache(self) {
	const stored = localStorage.getItem("appgendata"); // baca data dari local storage
	return stored
}


function AppGenIO_updateCache(data) {
	localStorage.setItem("appgendata", JSON.stringify(data));
	console.log(`saved ${timestamp()}`)
}

function AppGenIO_AutoSave(self) {
	// autosave ke local storage per 10 detik
	const svr = setInterval(async ()=>{
		try {
			if (!self.autoSavePaused) {
				var data = await AppGenIO_GetCurrentWorkData(self)
				AppGenIO_updateCache(data)
			}
			// clearInterval(svr)
		} catch (err) {
			console.log(err.message)
		}
	}, 10000)
}

/*
async function AppGenIO_Save(self, evt) {
	try {
		var data = await AppGenIO_GetCurrentWorkData(self)

		
		// coba save ke file
		const pretty = JSON.stringify(data, null, 2); // indentasi 2 spasi
		const blob = new Blob([pretty], { type: "application/json" });
		const url = URL.createObjectURL(blob);

		const a = document.createElement("a");
		a.href = url;
		a.download = `${data.name}.json`;
		
		if (data.name!='' && data.name!=null) {
			a.click();
		}

		URL.revokeObjectURL(url);

	} catch (err) {
		await $fgta5.MessageBox.error(err.message)
	}
	
}
*/


async function AppGenIO_GetCurrentWorkData(self) {
	const PROG = {
		id: '',
		appname: '',
		name: '',
		directory: '',
		title: '',
		description: '',
		icon: '',
		primary_entity_id: '',
		primary_entity_name: '',
		actions: [],
		entities: {},
		uniques: {},
		search: {},
	}
	
	try {
		AppGenIO_GetDef(self, PROG)
		AppGenIO_GetActions(self, PROG)
		AppGenIO_GetEntities(self, PROG)

		return PROG
	} catch (err) {
		throw err
	}


}

function AppGenIO_GetDef(self, PROG) {
	const obj_programid = document.getElementById('obj_programid')
	const obj_appname = document.getElementById('obj_appname')
	const obj_programname = document.getElementById('obj_programname')
	const obj_programtitle = document.getElementById('obj_programtitle')
	const obj_directory = document.getElementById('obj_directory')
	const obj_programdescription = document.getElementById('obj_programdescription')
	const obj_icon = document.getElementById('upload-icon')


	PROG.id = obj_programid.value
	PROG.appname = obj_appname.value
	PROG.name = obj_programname.value
	PROG.title = obj_programtitle.value 
	PROG.directory = obj_directory.value
	PROG.description = obj_programdescription.value
	PROG.icon = obj_icon.style.backgroundImage

}

function AppGenIO_GetActions(self, PROG) {
	PROG.actions = []

	const actionlist = document.getElementById('action-lists')
	const trs = actionlist.querySelectorAll('tr')
	for (let tr of trs) {
		const elname = tr.querySelector('[name="action-name"]')
		const eltitle = tr.querySelector('[name="action-title"]')

		PROG.actions.push({
			name: elname.innerHTML,
			title: eltitle.innerHTML
		})
	}

}

function AppGenIO_GetEntities(self, PROG) {
	const el = document.getElementById('data-entities')
	const trs = el.querySelectorAll('tr')
	for (var tr of trs) {
		tr.classList.remove('field-error')
		try {
			var entity_id = tr.getAttribute('data-entity-id')
			let entity = AppGenIO_GetEntityData(self, entity_id)	
			
			if (!isValidName(entity.name)) {
				throw new Error(`entity name '${entity.name}' is not valid`)
			}

			if (PROG.entities[entity.name]!==undefined) {
				// sudah ada, entiti duplikasi
				throw new Error(`entity ${entity.name} is duplicated`)
			}

			PROG.entities[entity.name] = entity
			if (entity.isheader) {
				PROG.primary_entity_id = entity_id
				PROG.primary_entity_name = entity.name
			}
		} catch (err) {
			tr.classList.add('field-error')
			throw err
		}
	}
}


function AppGenIO_GetEntityData(self, entity_id) {
	var entity = {
		id: entity_id
	}

	var de = document.getElementById('entities-design')
	var editor = de.querySelector(`div[name="entity-editor"][${ATTR_ENTITYID}="${entity_id}"]`)
	editor.entity_id = entity_id


	// get data info
	var elName = editor.querySelector('div[name="designer-info"] div[name="col_name"]')
	var elTitle = editor.querySelector('div[name="designer-info"] div[name="col_title"]')
	var elTable = editor.querySelector('div[name="designer-info"] div[name="col_table"]')
	var elPK = editor.querySelector('div[name="designer-info"] div[name="col_pk"]')
	var elInputDescr = editor.querySelector('div[name="designer-info"] input[name="table-descr"]')
	var elChkRowAdd = editor.querySelector('div[name="designer-info"] input[name="allow-row-add"]')
	var elChkRowRemove = editor.querySelector('div[name="designer-info"] input[name="allow-row-remove"]')

	var elIdMethod = editor.querySelector('div[name="designer-info"] select[name="identifier-method"]')
	var elIdfPrefix = editor.querySelector('div[name="designer-info"] input[name="identifier-prefix"]')
	var elIdBlock = editor.querySelector('div[name="designer-info"] input[name="identifier-block"]')
	var elIdLength = editor.querySelector('div[name="designer-info"] input[name="identifier-length"]')




	entity.name = elName.innerHTML
	entity.isheader = entity.name=='header' ? true : false;
	entity.title = elTitle.innerHTML
	entity.table = elTable.innerHTML
	entity.pk = elPK.innerHTML
	entity.descr = elInputDescr.value
	entity.allowRowAdd = elChkRowAdd.checked ? true : false
	entity.allowRowRemove = elChkRowRemove.checked ? true : false
	entity.identifierMethod = elIdMethod.value
	entity.identifierPrefix = elIdfPrefix.value
	entity.identifierBlock = elIdBlock.value
	entity.identifierLength = elIdLength.value
	

	entity.Items = {}


	// ambil data items
	let elAllFields = editor.querySelectorAll('div[name="design-data-field"]')
	for (let elfield of elAllFields) {
		elfield.classList.remove('field-error')
	}

	for (let elfield of elAllFields) {
		let field = AppGenIO_GetFieldData(self, elfield)
		if (entity.Items[field.name]!==undefined) {
			elfield.classList.add('field-error')
			throw new Error(`fieldname '${field.name}' duplicated!`)
		}
		entity.Items[field.name] = field
	}

	// ambil data unique
	entity.Uniques = AppGenIO_GetEntityUnique(self, editor)
	entity.Search = AppGenIO_GetEntitySearch(self, editor)



	return entity
}

function AppGenIO_GetEntityUnique(self, editor) {
	const uniques = {}
	const tbl = editor.querySelector('table[name="tbl-unique"]')
	const trs = tbl.querySelectorAll(`tr[${ATTR_ROWUNIQUE}]`)
	for (var tr of trs) {
		const tdName = tr.querySelector('td[data-name="name"]')
		const tdFields = tr.querySelector('td[data-name="fields"]')
		const name = tdName.innerHTML
		const fields = tdFields.innerHTML

		uniques[name] = {name, fields}
	}

	return uniques
}

function AppGenIO_GetEntitySearch(self, editor) {
	const search = {}
	const tbl = editor.querySelector('table[name="tbl-search"]')
	const trs = tbl.querySelectorAll(`tr[${ATTR_ROWUNIQUE}]`)
	for (var tr of trs) {
		const tdName = tr.querySelector('td[data-name="name"]')
		const tdLabel = tr.querySelector('td[data-name="label"]')
		const tdFields = tr.querySelector('td[data-name="fields"]')
		const name = tdName.innerHTML
		const label = tdLabel.innerHTML
		const fields = tdFields.innerHTML

		search[name] = {name, label, fields}
	}

	return search
}



function AppGenIO_GetFieldData(self, el) {
	const field = {}
	
	field.component = el.getAttribute(ATTR_COMPNAME)
	field.data_fieldname = getValueFrom(el, 'input[name="fieldname"]', 'value')
	field.name = field.data_fieldname

	// ambil type variable
	var sel_datatyle = el.querySelector('select[name="datatype"]')
	field.data_type = sel_datatyle.options[sel_datatyle.selectedIndex].value

	field.data_length = getValueFrom(el, 'input[name="datalength"]', 'value') ?? 0
	field.data_precision = getValueFrom(el, 'input[name="dataprecission"]', 'value') ?? 0

	// allownull
	field.data_allownull = getCheckedFrom(el, 'input[name="allownull"]')

	// get defaul value
	if (field.component=='Checkbox') {
		var defaultChecked = getCheckedFrom(el, 'input[name="defaultvalue"]')
		field.data_defaultvalue = defaultChecked ? 1 : 0
	} else {
		var txt_defaultvalue = el.querySelector('input[name="defaultvalue"]')
		field.data_defaultvalue = txt_defaultvalue.value
	}

	// field description
	field.description = getValueFrom(el, 'input[name="description"]', 'value') ?? ''


	// object related
	field.input_name = getValueFrom(el, 'input[name="objectname"]', 'value') ?? ''
	field.input_label = getValueFrom(el, 'input[name="labeltext"]', 'value') ?? ''
	field.input_placeholder = getValueFrom(el, 'input[name="placeholder"]', 'value') ?? ''
	field.input_caption = getValueFrom(el, 'input[name="caption"]', 'value') ?? ''
	field.input_information = getValueFrom(el, 'input[name="information"]', 'value') ?? ''
	field.input_containercss = getValueFrom(el, 'input[name="input-containercss"]', 'value') ?? ''
	field.input_inlinestyle = getValueFrom(el, 'input[name="input-inlinestyle"]', 'value') ?? ''
	
	
	var sel_charcase = el.querySelector('select[name="charcasing"]')
	if (sel_charcase!=null) {
		field.input_charcase = sel_charcase.value
	} else {
		field.input_charcase = 'normal'
	}

	var chk_inputdisabled = el.querySelector('input[name="disabledinform"]')
	field.input_disabled = chk_inputdisabled.checked ? true : false 

	var chk_showingrid =  el.querySelector('input[name="showingrid"]')
	field.showInGrid = chk_showingrid.checked ? true : false

	var chk_showinform =  el.querySelector('input[name="showinform"]')
	field.showInForm = chk_showinform.checked ? true : false

	// grid related
	field.grid_formatter = getValueFrom(el, 'input[name="gridformatter"]', 'value') ?? ''
	field.grid_css = getValueFrom(el, 'input[name="gridcss"]', 'value') ?? ''
	field.grid_inlinestyle = getValueFrom(el, 'input[name="gridinlinestyle"]', 'value') ?? ''
	field.grid_sorting = getCheckedFrom(el, 'input[name="gridsorting"]')



	field.Validation = {}

	// isRequired
	field.Validation.isRequired = getCheckedFrom(el, 'input[name="isrequired"]')
	field.Validation.isMinimum = getCheckedFrom(el, 'input[name="isbatasmin"]')
	field.Validation.isMaximum = getCheckedFrom(el, 'input[name="isbatasmax"]')
	field.Validation.Minimum = getValueFrom(el, 'input[name="minimum"]', 'value')
	field.Validation.Maximum = getValueFrom(el, 'input[name="maximum"]', 'value')
	field.Validation.messageDefault = getValueFrom(el, 'input[name="msg_invalid_default"]', 'value')
	field.Validation.messageRequired = getValueFrom(el, 'input[name="msg_invalid_required"]', 'value')
	field.Validation.messageMinimum = getValueFrom(el, 'input[name="msg_invalid_minimum"]', 'value')
	field.Validation.messageMaximum = getValueFrom(el, 'input[name="msg_invalid_maximum"]', 'value')
	field.Validation.hasCustomValidator = getCheckedFrom(el, 'input[name="hascustomvalidator"]')
	field.Validation.customValidator = getValueFrom(el, 'input[name="validator"]', 'value')

	

	field.Reference = {}
	field.Reference.table = getValueFrom(el, 'input[name="ref_table"]', 'value')
	field.Reference.pk = getValueFrom(el, 'input[name="ref_id"]', 'value')
	field.Reference.bindingValue = getValueFrom(el, 'input[name="ref_id"]', 'value')
	field.Reference.bindingText = getValueFrom(el, 'input[name="ref_text"]', 'value')
	field.Reference.bindingDisplay = getValueFrom(el, 'input[name="ref_display"]', 'value')
	field.Reference.loaderApiModule = getValueFrom(el, 'input[name="loaderapimodule"]', 'value')
	field.Reference.loaderApiPath = getValueFrom(el, 'input[name="loaderapipath"]', 'value')

	
	field.Handle = {}
	field.Handle.changed = getCheckedFrom(el, 'input[name="ishandlechanged"]')
	field.Handle.input = getCheckedFrom(el, 'input[name="ishandleinput"]')
	field.Handle.keydown = getCheckedFrom(el, 'input[name="ishandlekeydown"]')
	field.Handle.checked = getCheckedFrom(el, 'input[name="ishandlechecked"]')
	field.Handle.selected = getCheckedFrom(el, 'input[name="ishandleselected"]')
	field.Handle.selecting = getCheckedFrom(el, 'input[name="ishandleselecting"]')
	field.Handle.populating = getCheckedFrom(el, 'input[name="ishandlepopulating"]')
	field.Handle.loadingdata = getCheckedFrom(el, 'input[name="ishandleloadingdata"]')


	if (!isValidName(field.data_fieldname)) {
		el.classList.add('field-error')
		throw new Error('Field Name is not valid')
	} 

	return field
}



async function AppGenIO_Reset(self) {
	const datainit = {
		id: '',
		appname: '',
		name: '',
		directory: '',
		title: '',
		description: '',
		icon: '',
		primary_entity_id: '',
		primary_entity_name: '',
		actions: [],
		entities: {},
	}
	await AppGenIO_ReadData(self, JSON.stringify(datainit))
}

async function AppGenIO_ReadData(self, content) {
	const data = JSON.parse(content)
	AppGenIO_Load(self, data)
}

async function AppGenIO_Load(self, data) {
	// data def
	const obj_programid = document.getElementById('obj_programid')
	const obj_appname = document.getElementById('obj_appname')
	const obj_programname = document.getElementById('obj_programname')
	const obj_programtitle = document.getElementById('obj_programtitle')
	const obj_directory = document.getElementById('obj_directory')
	const obj_programdescription = document.getElementById('obj_programdescription')
	const obj_icon = document.getElementById('upload-icon')

	obj_programid.value = data.id 
	obj_appname.value = data.appname
	obj_programname.value = data.name
	obj_programtitle.value = data.title
	obj_directory.value = data.directory
	obj_programdescription.value = data.description
	obj_icon.style.backgroundImage = data.icon


	// actions
	const elActions = document.getElementById('action-lists')
	elActions.innerHTML = ''
	for (var action of data.actions) {
		self.addAction(action)
	}

	// clear data entity
	const elEntities = document.getElementById('data-entities')
	elEntities.innerHTML = ''

	// clear data design
	const elEntityDesign = document.getElementById('entities-design')
	elEntityDesign.innerHTML = ''

	const tbl_entity =document.getElementById('tbl_entity')
	const tbody = tbl_entity.querySelector('tbody')
	var de = document.getElementById('entities-design')
	for (var entityname in data.entities) {
		var entity = data.entities[entityname]


		await self.AddEntity({
			col_id: entity.id,
			col_name: entity.name,
			col_title: entity.title,
			col_table: entity.table,
			col_pk: entity.pk,
			isheader: entity.isheader
		})

		self.startDesign(entity.id, true) // supperss start design

		const btn = tbody.querySelector(`[name="col_btndesign"][${ATTR_ENTITYID}="${entity.id}"]`)
		btn.click()
		

		// isikan data entity
		// TODO: isikan data entity
		const editor = de.querySelector(`div[name="entity-editor"][${ATTR_ENTITYID}="${entity.id}"]`)
		setValueTo(entity.descr, editor, 'div[name="designer-info"] input[name="table-descr"]', 'value')
		setCheckedTo(entity.allowRowAdd, editor, 'div[name="designer-info"] input[name="allow-row-add"]')
		setCheckedTo(entity.allowRowRemove, editor, 'div[name="designer-info"] input[name="allow-row-remove"]')
		setValueTo(entity.identifierMethod, editor, 'div[name="designer-info"] select[name="identifier-method"]', 'value')
		setValueTo(entity.identifierPrefix, editor, 'div[name="designer-info"] input[name="identifier-prefix"]', 'value')
		setValueTo(entity.identifierBlock , editor, 'div[name="designer-info"] input[name="identifier-block"]', 'value')
		setValueTo(entity.identifierLength, editor, 'div[name="designer-info"] input[name="identifier-length"]', 'value')

		// ambil drop target dari entity
		let droptarget = elEntityDesign.querySelector(`div[name="entity-editor"][${ATTR_ENTITYID}="${entity.id}"] div[name="drop-target"]`)
	
		// console.log(entity)
		for (var item_id in entity.Items) {
			let item = entity.Items[item_id]

			var componentname = item.component
			
			let comp = Components[componentname]
			let datafield = self.addComponentToDesigner(droptarget, comp)

			// isi datafieldnya
			AppGenIO_FillDataField(self, datafield, item)
		}

		// uniques
		for (var uniq_name in entity.Uniques) {
			let uniq = entity.Uniques[uniq_name]
			let name = uniq.name
			let fields = uniq.fields
			Context.addUnique({uniq_name:name, uniq_fields:fields}, entity.id)
		}

		// search
		for (var search_name in entity.Search) {
			let search = entity.Search[search_name]
			let name = search.name
			let label = search.label
			let fields = search.fields
			Context.addSearch({
				criteria_name: name,
				criteria_label: label, 
				criteria_fields:fields
			}, entity.id)
		}
		
	}

}

function AppGenIO_FillDataField(self, datafield, field) {

	setValueTo(field.data_fieldname, datafield, 'input[name="fieldname"]', 'value')
	setValueTo(field.data_fieldname, datafield, 'input[name="fieldname-summary"]', 'value')

	setSelectedTo(field.data_type, datafield, 'select[name="datatype"]')

	setValueTo(field.data_length, datafield, 'input[name="datalength"]', 'value')
	setValueTo(field.data_precision, datafield, 'input[name="dataprecission"]', 'value')

	setCheckedTo(field.data_allownull, datafield, 'input[name="allownull"]')

	if (field.component=='Checkbox') {
		setCheckedTo(field.data_defaultvalue, datafield, 'input[name="defaultvalue"]')
	} else {
		setValueTo(field.data_defaultvalue, datafield, 'input[name="defaultvalue"]', 'value')
	}
	setValueTo(field.description, datafield, 'input[name="description"]', 'value')


	// object related
	setValueTo(field.input_name, datafield, 'input[name="objectname"]', 'value')
	setValueTo(field.input_label, datafield, 'input[name="labeltext"]', 'value')
	setValueTo(field.input_placeholder, datafield, 'input[name="placeholder"]', 'value')
	setValueTo(field.input_caption, datafield, 'input[name="caption"]', 'value')
	setValueTo(field.input_information, datafield, 'input[name="information"]', 'value')
	setValueTo(field.input_containercss, datafield, 'input[name="input-containercss"]', 'value')
	setValueTo(field.input_inlinestyle, datafield, 'input[name="input-inlinestyle"]', 'value')

	setSelectedTo(field.input_charcase, datafield, 'select[name="charcasing"]')

	setCheckedTo(field.input_disabled, datafield, 'input[name="disabledinform"]')
	setCheckedTo(field.showInGrid, datafield, 'input[name="showingrid"]')
	setCheckedTo(field.showInForm, datafield, 'input[name="showinform"]')


	// grid related
	setValueTo(field.grid_formatter, datafield, 'input[name="gridformatter"]', 'value')
	setValueTo(field.grid_css, datafield, 'input[name="gridcss"]', 'value')
	setValueTo(field.grid_inlinestyle, datafield, 'input[name="gridinlinestyle"]', 'value')
	setCheckedTo(field.grid_sorting, datafield, 'input[name="gridsorting"]')


	setCheckedTo(field.Validation.isRequired, datafield, 'input[name="isrequired"]')
	setCheckedTo(field.Validation.isMinimum, datafield, 'input[name="isbatasmin"]')
	setCheckedTo(field.Validation.isMaximum, datafield, 'input[name="isbatasmax"]')

	setValueTo(field.Validation.Minimum, datafield, 'input[name="minimum"]', 'value')
	setValueTo(field.Validation.Maximum, datafield, 'input[name="maximum"]', 'value')
	setValueTo(field.Validation.messageDefault, datafield, 'input[name="msg_invalid_default"]', 'value')
	setValueTo(field.Validation.messageRequired, datafield, 'input[name="msg_invalid_required"]', 'value')
	setValueTo(field.Validation.messageMinimum, datafield, 'input[name="msg_invalid_minimum"]', 'value')
	setValueTo(field.Validation.messageMaximum, datafield, 'input[name="msg_invalid_maximum"]', 'value')

	setCheckedTo(field.Validation.hasCustomValidator, datafield, 'input[name="hascustomvalidator"]')
	setValueTo(field.Validation.customValidator, datafield, 'input[name="validator"]', 'value')


	setValueTo(field.Reference.table, datafield, 'input[name="ref_table"]', 'value')
	setValueTo(field.Reference.pk, datafield, 'input[name="ref_id"]', 'value')
	
	// TODO: ini nanti kalau perlu diperbaiki disini
	// setValueTo(field.Reference.bindingValue, datafield, 'input[name="ref_id"]', 'value')
	
	setValueTo(field.Reference.bindingDisplay, datafield, 'input[name="ref_display"]', 'value')
	setValueTo(field.Reference.bindingText, datafield, 'input[name="ref_text"]', 'value')


	setValueTo(field.Reference.loaderApiModule, datafield, 'input[name="loaderapimodule"]', 'value')
	setValueTo(field.Reference.loaderApiPath, datafield, 'input[name="loaderapipath"]', 'value')

	setCheckedTo(field.Handle.changed, datafield, 'input[name="ishandlechanged"]')
	setCheckedTo(field.Handle.input, datafield, 'input[name="ishandleinput"]')
	setCheckedTo(field.Handle.keydown, datafield, 'input[name="ishandlekeydown"]')
	setCheckedTo(field.Handle.checked, datafield, 'input[name="ishandlechecked"]')
	setCheckedTo(field.Handle.selected, datafield, 'input[name="ishandleselected"]')
	setCheckedTo(field.Handle.selecting, datafield, 'input[name="ishandleselecting"]')
	setCheckedTo(field.Handle.populating, datafield, 'input[name="ishandlepopulating"]')
	setCheckedTo(field.Handle.loadingdata, datafield, 'input[name="ishandleloadingdata"]')

}