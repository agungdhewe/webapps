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

	let sectionTitle = capitalizeWords(`${sectionPart} ${data.title}`)
	if (entityName == 'header' && sectionPart == 'list') {
		sectionTitle = capitalizeWords(data.title)
	}

	return {
		partName: sectionPart,
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

	// Default Value hanya untuk Textbox, Numberbox, Checkbox
	if (['Textbox', 'Numberbox', 'Checkbox'].includes(item.component)) {
		if (item.data_defaultvalue != '') {
			cfg.push(`value="${item.data_defaultvalue}"`)
		}
	}

	if (item.index != '' && item.index != '0') {
		cfg.push(`data-tabindex="${item.index}"`)
	}


	if (item.input_inlinestyle.trim() != '') {
		cfg.push(`style="${item.input_inlinestyle}"`)
	}

	if (item.input_charcase != 'normal') {
		cfg.push(`character-case="${item.input_charcase}"`)
	}

	if (item.Validation.isRequired) {
		cfg.push('required')

		if (item.Validation.messageRequired.trim() != '') {
			cfg.push(`invalid-message-required="${item.Validation.messageRequired}"`)
		}
	}

	if (item.input_information.trim() != '') {
		cfg.push(`description="${item.input_information}"`)
	}


	// multiline, hanya untuk textbox
	if (item.component == 'Textbox') {
		if (item.input_multiline) {
			cfg.push('multiline')
		}
	}


	// data length in character
	if (item.component == 'Textbox') {
		cfg.push(`autocomplete="off" spellcheck="false"`)

		cfg.push(`maxlength="${item.data_length}"`)

		if (item.Validation.isMinimum) {
			cfg.push(`minlength="${item.Validation.Minimum}"`)

			if (item.Validation.messageMinimum.trim() != '') {
				cfg.push(`invalid-message-minlength="${item.Validation.messageMinimum}"`)
			}
		}

	} else if (item.component == 'Numberbox') {

		if (item.data_precision > 0) {
			const datalen = Number(item.data_length) + 1
			cfg.push(`precision="${item.data_precision}"`)
			cfg.push(`maxlength="${datalen}"`)
		} else {
			cfg.push(`maxlength="${item.data_length}"`)
		}




		if (item.Validation.isMinimum) {
			cfg.push(`min="${item.Validation.Minimum}"`)
			if (item.Validation.messageMinimum.trim() != '') {
				cfg.push(`invalid-message-min="${item.Validation.messageMinimum}"`)
			}
		}

		if (item.Validation.isMaximum) {
			cfg.push(`max="${item.Validation.Maximum}"`)
			if (item.Validation.messageMaximum.trim() != '') {
				cfg.push(`invalid-message-max="${item.Validation.messageMaximum}"`)
			}
		}

		if (item.data_type == 'smallint') {
			cfg.push(`digitgrouping="false"`)
		}

	} else if (item.component == 'Checkbox') {
		cfg.push(`type="checkbox"`)


	} else if (item.component == 'Combobox') {
		if (item.Reference.bindingDisplay != '' && item.Reference.bindingDisplay != null) {
			cfg.push(`data-display="${item.Reference.bindingDisplay}"`)
		} else {
			cfg.push(`data-display="${item.Reference.bindingText}"`)
		}

	}

	if (item.Validation.hasCustomValidator) {
		cfg.push(`validator="${item.Validation.customValidator}"`)
	}

	if (item.Validation.messageDefault.trim() != '') {
		cfg.push(`invalid-message="${item.Validation.messageDefault}"`)
	}


	if (item.input_disabled) {
		cfg.push('disabled')
	}

	return cfg
}
