import { ICON_CLOSE } from './appgen-icons.mjs'

const ATTR_ENTITYID = 'data-entity-id'
const ATTR_ROWSEARCH = 'data-rowsearch'

let ME


export function AppGenLayout_setSearchME(me) {
	ME = me
}


export function AppGenLayout_setupSearchDesigner(elsearch, entity_id) {
	const tbl = elsearch.querySelector('table[name="tbl-search"]')
	const btnAdd = elsearch.querySelector('button[name="btnAdd"]')
	const btnNew = elsearch.querySelector('a[name="btnNew"')
	const trLineAdd = btnAdd.closest('tr')
	
	tbl.setAttribute(ATTR_ENTITYID, entity_id)
	btnAdd.setAttribute(ATTR_ENTITYID, entity_id)
	trLineAdd.setAttribute(ATTR_ENTITYID, entity_id)
	
	btnAdd.addEventListener('click', AppGenLayout_addSearchButtonClick)
	btnNew.addEventListener('click', AppGenLayout_newSearchButtonClick)

}

function AppGenLayout_newSearchButtonClick(evt) {
	const tr = evt.target.closest('tr')
	const elName = tr.querySelector('input[name="criteria_name"]')
	const elLabel = tr.querySelector('input[name="criteria_label"]')
	const elFields = tr.querySelector('input[name="criteria_fields"]')

	// reset editor entri
	elName.disabled = false
	elName.value = ''
	elLabel.value = ''
	elFields.value = ''
}

function AppGenLayout_addSearchButtonClick(evt) {
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

	try {

		AppGenLayout_addSearch(data, entity_id)

		// reset editor entri
		elName.disabled = false
		elName.value = ''
		elLabel.value = ''
		elFields.value = ''

	} catch (err) {
		$fgta5.MessageBox.warning(err.message)
	}


}




async function AppGenLayout_removeSearchButtonClick(evt) {
	var res = await $fgta5.MessageBox.confirm('removing item is irreversible. Are you sure ?')
	if (res=='ok') {
		const btn = evt.target
		const tr = evt.target.closest('tr')
		tr.remove()
	}
}

function AppGenLayout_rowSearchEdit(evt) {
	const tr = evt.target.closest('tr')
	const tbl = tr.closest('table')
	const tdName = tr.querySelector(`td[data-name="name"]`)
	const tdLabel = tr.querySelector(`td[data-name="label"]`)
	const tdFields = tr.querySelector(`td[data-name="fields"]`)


	// get editor
	const btnAddEditor = tbl.querySelector('button[name="btnAdd"]')
	const trEditor = btnAddEditor.closest('tr')
	const elName = trEditor.querySelector('input[name="criteria_name"]')
	const elLabel = trEditor.querySelector('input[name="criteria_label"]')
	const elFields = trEditor.querySelector('input[name="criteria_fields"]')

	elName.disabled = true
	elName.value = tdName.innerHTML
	elLabel.value = tdLabel.innerHTML
	elFields.value = tdFields.innerHTML
}

export function AppGenLayout_addSearch(data, entity_id) {
	const tbl = ME.EntityDesigner.querySelector(`table[name="tbl-search"][${ATTR_ENTITYID}="${entity_id}"`)
	const btn = tbl.querySelector('button[name="btnAdd"]')
	const tr = btn.closest('tr')

	const criteria_name = data.criteria_name
	const criteria_label = data.criteria_label
	const criteria_fields = data.criteria_fields


	if (!/^[a-zA-Z_]+$/.test(criteria_name)) {
		throw new Error('Nama criteria tidak valid')
	}


	// cek apakah sudah ada criteria_name
	const trExists = tbl.querySelector(`tr[data-value="${criteria_name}"]`)
	if (trExists!=null) {
		const tdLabel = trExists.querySelector(`td[data-name="label"]`)
		const tdFields = trExists.querySelector(`td[data-name="fields"]`)
		tdLabel.innerHTML = criteria_label
		tdFields.innerHTML = criteria_fields

	} else {
		// tambahkan search
		const newRow = document.createElement('tr')
		const tdName = document.createElement('td')
		const tdLabel = document.createElement('td')
		const tdFields = document.createElement('td')
		const tdControl = document.createElement('td')
		const btnRemove = document.createElement('div')
		btnRemove.classList.add('action-button-remove')
		btnRemove.innerHTML = ICON_CLOSE
		btnRemove.addEventListener('click', AppGenLayout_removeSearchButtonClick)
		tdName.addEventListener('click', AppGenLayout_rowSearchEdit)
		tdLabel.addEventListener('click', AppGenLayout_rowSearchEdit)
		tdFields.addEventListener('click', AppGenLayout_rowSearchEdit)



		tdName.innerHTML = criteria_name
		tdName.setAttribute('data-name', 'name')
		tdName.classList.add('search-editor-item')

		tdLabel.innerHTML = criteria_label
		tdLabel.setAttribute('data-name', 'label')
		tdLabel.classList.add('search-editor-item')

		tdFields.innerHTML = criteria_fields
		tdFields.setAttribute('data-name', 'fields')
		tdFields.classList.add('search-editor-item')

		tdControl.appendChild(btnRemove)


		newRow.appendChild(tdName)
		newRow.appendChild(tdLabel)
		newRow.appendChild(tdFields)
		newRow.appendChild(tdControl)

		newRow.setAttribute('data-value', criteria_name)
		newRow.setAttribute(ATTR_ENTITYID, entity_id)
		newRow.setAttribute(ATTR_ROWSEARCH, '')

		tr.parentNode.insertBefore(newRow, tr);

	}

}