import { ICON_CLOSE } from './appgen-icons.mjs'

const ATTR_ENTITYID = 'data-entity-id'
const ATTR_ROWUNIQUE = 'data-rowuniqueindex'

let ME


export function AppGenLayout_setUniqueME(me) {
	ME = me
}

export function AppGenLayout_setupUniqueDesigner(eluniq, entity_id) {
	const tbl = eluniq.querySelector('table[name="tbl-unique"]')
	const btnAdd = eluniq.querySelector('button[name="btnAdd"]')
	const btnNew = eluniq.querySelector('a[name="btnNew"')
	const trLineAdd = btnAdd.closest('tr')
	
	tbl.setAttribute(ATTR_ENTITYID, entity_id)
	btnAdd.setAttribute(ATTR_ENTITYID, entity_id)
	trLineAdd.setAttribute(ATTR_ENTITYID, entity_id)
	
	btnAdd.addEventListener('click', AppGenLayout_addUniqueButtonClick)
	btnNew.addEventListener('click', AppGenLayout_newUniqueButtonClick)
}


function AppGenLayout_newUniqueButtonClick(evt) {
	const tr = evt.target.closest('tr')
	const elName = tr.querySelector('input[name="unique_name"]')
	const elFields = tr.querySelector('input[name="unique_fields"]')

	// reset editor entri
	elName.disabled = false
	elName.value = ''
	elFields.value = ''
}

function AppGenLayout_addUniqueButtonClick(evt) {
	const tr = evt.target.closest('tr')
	const entity_id = tr.getAttribute(ATTR_ENTITYID)
	const elName = tr.querySelector('input[name="unique_name"]')
	const elFields = tr.querySelector('input[name="unique_fields"]')
	
	const data = {
		uniq_name: elName.value,
		uniq_fields: elFields.value
	}

	try {
		
		AppGenLayout_addUnique(data, entity_id)

		// reset
		elName.disabled = false
		elName.value = ''
		elFields.value = ''

	} catch (err) {
		$fgta5.MessageBox.warning(err.message)
	}


}


async function AppGenLayout_removeUniqueButtonClick(evt) {
	var res = await $fgta5.MessageBox.confirm('removing item is irreversible. Are you sure ?')
	if (res=='ok') {
		const btn = evt.target
		const tr = evt.target.closest('tr')
		tr.remove()
	}
}




function AppGenLayout_rowUniqueEdit(evt) {
	const tr = evt.target.closest('tr')
	const tbl = tr.closest('table')
	const tdName = tr.querySelector(`td[data-name="name"]`)
	const tdFields = tr.querySelector(`td[data-name="fields"]`)


	// get editor
	const btnAddEditor = tbl.querySelector('button[name="btnAdd"]')
	const trEditor = btnAddEditor.closest('tr')
	const elName = trEditor.querySelector('input[name="unique_name"]')
	const elFields = trEditor.querySelector('input[name="unique_fields"]')

	elName.disabled = true
	elName.value = tdName.innerHTML
	elFields.value = tdFields.innerHTML
}


export function AppGenLayout_addUnique(data, entity_id) {
	const tbl = ME.EntityDesigner.querySelector(`table[name="tbl-unique"][${ATTR_ENTITYID}="${entity_id}"`)
	const btn = tbl.querySelector('button[name="btnAdd"]')
	const tr = btn.closest('tr')


	const uniq_name = data.uniq_name
	const uniq_fields = data.uniq_fields

	if (!/^[a-zA-Z_]+$/.test(uniq_name)) {
		throw new Error('Nama unique tidak valid')
	}


	// cek apakah sudah ada uniq_name
	const trExists = tbl.querySelector(`tr[data-value="${uniq_name}"]`)
	if (trExists!=null) {
		const tdFields = trExists.querySelector(`td[data-name="fields"]`)
		tdFields.innerHTML = uniq_fields

	} else {

		// tambahkan unique
		const newRow = document.createElement('tr')
		const tdName = document.createElement('td')
		const tdFields = document.createElement('td')
		const tdControl = document.createElement('td')
		const btnRemove = document.createElement('div')
		btnRemove.classList.add('action-button-remove')
		btnRemove.innerHTML = ICON_CLOSE
		btnRemove.addEventListener('click', AppGenLayout_removeUniqueButtonClick)
		tdName.addEventListener('click', AppGenLayout_rowUniqueEdit)
		tdFields.addEventListener('click', AppGenLayout_rowUniqueEdit)


		tdName.innerHTML = uniq_name
		tdName.setAttribute('data-name', 'name')
		tdName.classList.add('search-editor-item')

		tdFields.innerHTML = uniq_fields
		tdFields.setAttribute('data-name', 'fields')
		tdFields.classList.add('search-editor-item')

		tdControl.appendChild(btnRemove)

		newRow.appendChild(tdName)
		newRow.appendChild(tdFields)
		newRow.appendChild(tdControl)

		newRow.setAttribute('data-value', uniq_name)
		newRow.setAttribute(ATTR_ENTITYID, entity_id)
		newRow.setAttribute(ATTR_ROWUNIQUE, '')

		tr.parentNode.insertBefore(newRow, tr);
	}
}