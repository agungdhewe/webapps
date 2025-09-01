// file: templateProcessor.js
import fs from 'fs/promises';


export function kebabToCamel(str) {
	return str
		.split('-')
		.map((part, index) =>
		index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)
		)
		.join('');
}

export async function isFileExist(filepath) {
	try {
		await fs.access(filepath, fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
}


export function getSectionData(moduleName, entityName, data, sectionPart) {
	const sectionName = kebabToCamel(`${moduleName}-${entityName}-${sectionPart}`)
	const sectionTitle = capitalizeWords(`${sectionPart} ${data.title}`)

	return {
		sectionName: sectionName,
		sectionElementId: `${sectionName}-section`,
		sectionTitle: sectionTitle,
		primaryKey: data.pk,
		table: data.table
	}
}

export function capitalizeWords(input) {
	if (typeof input !== 'string') return '';

	return input
		.split(' ')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
}

export function createAdditionalAttributes(item) {
	const cfg = []
	
	if (item.data_defaultvalue!='') {
		cfg.push(`value="${item.data_defaultvalue}"`)
	}

	if (item.input_inlinestyle.trim()!='') {
		cfg.push(`style="${item.input_inlinestyle}"`)
	}

	if (item.input_charcase != 'normal') {
		cfg.push(`character-case="${item.input_charcase}"`)
	}
	
	if (item.Validation.isRequired) {
		cfg.push('required')

		if (item.Validation.messageRequired.trim()!='') {
			cfg.push(`invalid-message-required="${item.Validation.messageRequired}"`)
		}
	}

	if (item.input_information.trim()!='') {
		cfg.push(`description="${item.input_information}"`)
	}


	// data length in character
	if (item.component=='Textbox') {
		cfg.push(`autocomplete="off" spellcheck="false"`)

		cfg.push(`maxlength="${item.data_length}"`)

		if (item.Validation.isMinimum) {
			cfg.push(`minlength="${item.Validation.Minimum}"`)

			if (item.Validation.messageMinimum.trim()!='') {
				cfg.push(`invalid-message-minlength="${item.Validation.messageMinimum}"`)
			}
		}
	} else if (item.component=='Numberbox') {
		cfg.push(`maxlength="${item.data_length}"`)

		if (item.Validation.isMinimum) {
			cfg.push(`min="${item.Validation.Minimum}"`)
			if (item.Validation.messageMinimum.trim()!='') {
				cfg.push(`invalid-message-min="${item.Validation.messageMinimum}"`)
			}
		}

		if (item.Validation.isMaximum) {
			cfg.push(`max="${item.Validation.Maximum}"`)
			if (item.Validation.messageMaximum.trim()!='') {
				cfg.push(`invalid-message-max="${item.Validation.messageMaximum}"`)
			}
		}
	} else if (item.component=='Checkbox') {
		cfg.push(`type="checkbox"`)
	} else if (item.component=='Combobox') {
		cfg.push(`data-display="${item.Reference.bindingText}"`)
	}	

	if (item.Validation.hasCustomValidator) {
		cfg.push(`validator="${item.Validation.customValidator}"`)
	}

	if (item.Validation.messageDefault.trim()!='') {
		cfg.push(`invalid-message="${item.Validation.messageDefault}"`)
	}	


	if (item.input_disabled) {
		cfg.push('disabled')
	}

	return cfg      
}
