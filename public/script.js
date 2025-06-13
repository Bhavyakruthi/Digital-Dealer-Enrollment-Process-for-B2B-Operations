console.log('Form updated');
const steps = document.querySelectorAll('.form-step');
const progressBar = document.getElementById('progressBar');
const paginationItems = document.querySelectorAll('#stepPagination .page-item');
let currentStep = 0;
let currentAddressStep = 0; // 0 for Address 1, 1 for Address 2
let currentSupplierStep = 0; // 0 for Supplier 1, 1 for Supplier 2

console.log('Steps:', steps.length, steps);
console.log('Progress Bar:', progressBar);
console.log('Pagination Items:', paginationItems.length, paginationItems);

// Verify pagination matches steps
if (paginationItems.length !== steps.length) {
    console.warn('Pagination items mismatch:', paginationItems.length, 'vs', steps.length);
}

// CSS for validation feedback
const style = document.createElement('style');
style.innerHTML = `
    .error-messages { font-size: 0.9em; color: #dc3545; }
    .invalid { 
        border: 1px solid rgba(220, 53, 69, 0.5) !important; 
    }
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    .shake {
        animation: shake 0.5s ease-in-out;
    }
`;
document.head.appendChild(style);

// Set default date to today
document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0]; // e.g., 2025-06-12
    }
});

function showStep(step) {
    if (!steps[step] || !progressBar) return;
    steps.forEach((el, index) => {
        el.classList.toggle('active', index === step);
        paginationItems[index]?.classList.toggle('active', index === step);
    });
    progressBar.style.width = `${((step + 1) / steps.length) * 100}%`;
    if (steps[step].id === 'address-step') {
        switchToAddress(currentAddressStep);
    } else if (steps[step].querySelector('.supplier1')) {
        switchToSupplier(currentSupplierStep);
    }
    setupRealTimeValidation(steps[step]);
}

function validateInputs(inputs, errorContainer) {
    let errors = [];
    let isValid = true;
    const validatedRadioGroups = new Set();

    for (let input of inputs) {
        const id = input.id.toLowerCase();
        const value = input.type === 'radio' ? input.checked : input.value.trim();
        input.setCustomValidity('');
        input.classList.remove('invalid', 'shake');

        if (!input.required && !value && input.type !== 'radio') continue;

        if (input.type === 'radio') {
            const name = input.name;
            if (!name || validatedRadioGroups.has(name)) continue;
            validatedRadioGroups.add(name);
            const radioGroup = document.querySelectorAll(`input[name="${name}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);
            if (!isChecked && Array.from(radioGroup).some(radio => radio.required)) {
                input.setCustomValidity('Please select an option.');
                errors.push(`${input.labels[0]?.textContent || name}: Please select an option.`);
                radioGroup.forEach(radio => radio.classList.add('invalid', 'shake'));
                isValid = false;
            }
            continue;
        }

        if (input.required && !value) {
            input.setCustomValidity('This field is required.');
            errors.push(`${input.labels[0]?.textContent || input.name}: This field is required.`);
            input.classList.add('invalid', 'shake');
            isValid = false;
            continue;
        }

        if (['sales_name', 'customer_name', 'company_name', 'partner_company_name', 'contact1', 'contact2', 'supplier1_contact', 'supplier2_contact', 'supplier1_name', 'supplier2_name'].includes(id) && value) {
            if (!/^[a-zA-Z\s]+$/.test(value)) {
                input.setCustomValidity('Only letters and spaces allowed.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Only letters and spaces allowed.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['sales_email', 'email_id1', 'email_id2'].includes(id) && value) {
            const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
            if (!emailRegex.test(value)) {
                input.setCustomValidity('Invalid email format (e.g., abc@example.com) - should be in lowercase');
                errors.push(`${input.labels[0]?.textContent || input.name}: Invalid email format (e.g., abc@example.com) - should be in lowercase`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (id === 'emp_id' && value) {
            if (!/^[a-zA-Z0-9]+$/.test(value)) {
                input.setCustomValidity('Employee ID must be alphanumeric.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Employee ID must be alphanumeric.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (id === 'pan' && value) {
            const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
            if (!panRegex.test(value)) {
                input.setCustomValidity('Invalid PAN format (e.g., ABCDE1234F) - should be in caps');
                errors.push(`${input.labels[0]?.textContent || input.name}: Invalid PAN format (e.g., ABCDE1234F) - should be in caps`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (id === 'gst' && value) {
            const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
            if (!gstRegex.test(value)) {
                input.setCustomValidity('Invalid GST format (e.g., 22AAAAA0000A1Z5) - Should be in caps');
                errors.push(`${input.labels[0]?.textContent || input.name}: Invalid GST format (e.g., 22AAAAA0000A1Z5) - should be in caps`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
            const panInput = document.getElementById('pan');
            if (panInput && panInput.value.trim()) {
                const pan = panInput.value.trim().toUpperCase();
                const gstPanPart = value.toUpperCase().substring(2, 12);
                if (gstPanPart !== pan) {
                    input.setCustomValidity('GST must contain the same PAN (characters 3 to 12)');
                    errors.push(`${input.labels[0]?.textContent || input.name}: GST must contain the same PAN.`);
                    input.classList.add('invalid', 'shake');
                    isValid = false;
                    continue;
                }
            }
        }

        if (['year_incorporation', 'incorporation_year_company'].includes(id) && value) {
            const year = parseInt(value);
            const currentYear = new Date().getFullYear();
            if (isNaN(year) || year < 1000 || year > currentYear) {
                input.setCustomValidity(`Enter a valid year `);
                errors.push(`${input.labels[0]?.textContent || input.name}: Enter a valid year`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['customertype', 'category', 'status'].includes(id) && value === '') {
            input.setCustomValidity('Please select a valid option.');
            errors.push(`${input.labels[0]?.textContent || input.name}: Please select a valid option.`);
            input.classList.add('invalid', 'shake');
            isValid = false;
            continue;
        }

        if (id === 'othercustomertype' && input.required && !value) {
            input.setCustomValidity('Please specify the customer type.');
            errors.push(`${input.labels[0]?.textContent || input.name}: Please specify the customer type.`);
            input.classList.add('invalid', 'shake');
            isValid = false;
            continue;
        }

        if (['area', 'range'].includes(id) && value) {
            if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
                input.setCustomValidity('Only letters, numbers, and spaces allowed.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Only letters, numbers, and spaces allowed.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['city1', 'city2', 'state1', 'state2', 'country1', 'country2'].includes(id) && value) {
            if (!/^[a-zA-Z\s]+$/.test(value)) {
                input.setCustomValidity('Only letters and spaces allowed.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Only letters and spaces allowed.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['association_hbl', 'date'].includes(id) && value) {
            const today = new Date().toISOString().split('T')[0];
            if (value > today) {
                input.setCustomValidity('Date cannot be in the future.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Date cannot be in the future.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['fy_20_21', 'fy_21_22', 'fy_22_23'].includes(id) && value) {
            if (!/^\d+(\.\d{1,2})?$/.test(value) || isNaN(value) || parseFloat(value) < 0) {
                input.setCustomValidity('Enter a valid number for FY turnover.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Enter a valid positive number (up to 2 decimal places).`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['pin1', 'pin2'].includes(id) && value) {
            if (!/^\d{6}$/.test(value)) {
                input.setCustomValidity('PIN code must be exactly 6 digits.');
                errors.push(`${input.labels[0]?.textContent || input.name}: PIN code must be exactly 6 digits.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['phone1', 'phone2', 'mobile1', 'mobile2', 'supplier1_phone', 'supplier2_phone'].includes(id) && value) {
            if (!/^[1-9]\d{9}$/.test(value)) {
                input.setCustomValidity('Phone number must be 10 digits starting with 6–9.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Phone number must be 10 digits starting with 6–9.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['fax1', 'fax2'].includes(id) && value) {
            const faxRegex = /^\+?[0-9]{7,}$/;
            if (!faxRegex.test(value)) {
                input.setCustomValidity('Enter a valid fax number (e.g., +1234567890)');
                errors.push(`${input.labels[0]?.textContent || input.name}: Enter a valid fax number (e.g., +1234567890)`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['designation1', 'designation2', 'designation'].includes(id) && value) {
            if (!/^[a-zA-Z\s]+$/.test(value)) {
                input.setCustomValidity('Only letters and spaces allowed.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Only letters and spaces allowed.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['bank_name', 'branch_name', 'acc_type'].includes(id) && value) {
            if (!/^[a-zA-Z\s]+$/.test(value)) {
                input.setCustomValidity('Only letters and spaces allowed.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Only letters and spaces allowed.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (id === 'acc_number' && value) {
            if (!/^\d{10,18}$/.test(value)) {
                input.setCustomValidity('A/C number must be 10–18 digits.');
                errors.push(`${input.labels[0]?.textContent || input.name}: A/C number must be 10–18 digits.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (id === 'ifsc' && value) {
            const ifscRegex = /^[A-Z]{4}0[0-9A-Z]{6}$/;
            if (!ifscRegex.test(value)) {
                input.setCustomValidity('Invalid IFSC Code (e.g., SBIN0123456) - should be in uppercase');
                errors.push(`${input.labels[0]?.textContent || input.name}: Invalid IFSC Code (e.g., SBIN0123456) - should be in uppercase`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['security_cheque', 'pdc_cheque'].includes(id) && value) {
            if (!/^\d{6,}$/.test(value)) {
                input.setCustomValidity('Cheque number must be at least 6 digits.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Cheque number must be at least 6 digits.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (id === 'supplier2_name' && value) {
            const supplier1Name = document.getElementById('supplier1_name')?.value.trim();
            if (value === supplier1Name) {
                input.setCustomValidity('Supplier names must be distinct.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Supplier names must be distinct.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['supplier1_payment', 'supplier2_payment'].includes(id) && value) {
            if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
                input.setCustomValidity('Only letters, numbers, and spaces allowed.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Only letters, numbers, and spaces allowed.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['credit_limit_amount', 'cummulative', 'credit_limit', 'credit_limit_req', 'estm'].includes(id) && value) {
            if (isNaN(value) || parseFloat(value) <= 0) {
                input.setCustomValidity('Enter a valid positive amount.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Enter a valid positive amount.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['code_number', 'existing_code', 'division', 'requesting_branch'].includes(id) && value) {
            if (!/^[a-zA-Z0-9\s]+$/.test(value)) {
                input.setCustomValidity('Only letters, numbers, and spaces allowed.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Only letters, numbers, and spaces allowed.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (['sales_head', 'sales_ho', 'account_request_name', 'account_authorized_name', 'account_checked_name', 'account_request', 'account_authorized', 'account_checked'].includes(id) && value) {
            if (!/^[a-zA-Z\s]+$/.test(value)) {
                input.setCustomValidity('Only letters and spaces allowed.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Only letters and spaces allowed.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (id === 'photo' && input.required && input.files.length === 0) {
            input.setCustomValidity('Please upload a photo.');
            errors.push(`${input.labels[0]?.textContent || input.name}: Please upload a photo.`);
            input.classList.add('invalid', 'shake');
            isValid = false;
            continue;
        }

        if (id === 'photo' && input.files.length > 0) {
            const file = input.files[0];
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (!file.type.startsWith('image/')) {
                input.setCustomValidity('Please upload an image file (e.g., PNG, JPEG).');
                errors.push(`${input.labels[0]?.textContent || input.name}: Please upload an image file.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
            if (file.size > maxSize) {
                input.setCustomValidity('File size must be less than 2MB.');
                errors.push(`${input.labels[0]?.textContent || input.name}: File size must be less than 2MB.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (id === 'sign' && input.required && input.files.length === 0) {
            input.setCustomValidity('Please upload a sign and seal image.');
            errors.push(`${input.labels[0]?.textContent || input.name}: Please upload a sign and seal image.`);
            input.classList.add('invalid', 'shake');
            isValid = false;
            continue;
        }

        if (id === 'sign' && input.files.length > 0) {
            const file = input.files[0];
            const maxSize = 2 * 1024 * 1024; // 2MB
            if (!file.type.startsWith('image/')) {
                input.setCustomValidity('Please upload an image file (e.g., PNG, JPEG).');
                errors.push(`${input.labels[0]?.textContent || input.name}: Please upload an image file.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
            if (file.size > maxSize) {
                input.setCustomValidity('File size must be less than 2MB.');
                errors.push(`${input.labels[0]?.textContent || input.name}: File size must be less than 2MB.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
                continue;
            }
        }

        if (id === 'declaration' && !input.checked) {
            input.setCustomValidity('You must agree to the declaration.');
            errors.push(`${input.labels[0]?.textContent || input.name}: You must agree to the declaration.`);
            input.classList.add('invalid', 'shake');
            isValid = false;
            continue;
        }

        if ((id === 'credit_limit_amount' || id === 'cummulative') && document.getElementById('yes')?.checked) {
            if (!value) {
                input.setCustomValidity(`${id === 'cummulative' ? 'Cumulative' : 'Credit limit'} amount is required when requesting credit.`);
                errors.push(`${input.labels[0]?.textContent || input.name}: Required when requesting credit.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
            } else if (isNaN(value) || parseFloat(value) <= 0) {
                input.setCustomValidity('Enter a valid positive amount.');
                errors.push(`${input.labels[0]?.textContent || input.name}: Enter a valid positive amount.`);
                input.classList.add('invalid', 'shake');
                isValid = false;
            }
        }
    }

    if (errorContainer) {
        errorContainer.style.display = errors.length > 0 ? 'block' : 'none';
        errorContainer.innerHTML = errors.length > 0 ? '<ul>' + errors.map(err => `<li>${err}</li>`).join('') + '</ul>' : '';
    } else {
        console.warn('Error container not found for section');
        const section = inputs[0]?.closest('.form-step') || inputs[0]?.parentElement;
        if (section) {
            errorContainer = createErrorContainer(section);
            errorContainer.style.display = errors.length > 0 ? 'block' : 'none';
            errorContainer.innerHTML = errors.length > 0 ? '<ul>' + errors.map(err => `<li>${err}</li>`).join('') + '</ul>' : '';
        }
    }

    return isValid;
}

function setupRealTimeValidation(section) {
    if (!section) return;
    const inputs = section.querySelectorAll('input, select, textarea');
    const errorContainer = section.querySelector('.error-messages') || createErrorContainer(section);

    inputs.forEach(input => {
        input.removeEventListener('blur', handleValidation);
        input.removeEventListener('input', handleValidation);
        input.removeEventListener('change', handleValidation);

        input.addEventListener('blur', handleValidation);
        input.addEventListener('input', handleValidation);
        if (input.type === 'file' || input.type === 'checkbox' || input.type === 'radio') {
            input.addEventListener('change', handleValidation);
        }
    });

    function handleValidation(event) {
        const input = event.target;
        if (input.type === 'radio') {
            const radioGroup = section.querySelectorAll(`input[name="${input.name}"]`);
            validateInputs(radioGroup, errorContainer);
        } else {
            validateInputs([input], errorContainer);
        }
    }
}

function createErrorContainer(section) {
    if (!section) {
        console.error('Cannot create error container: section is null');
        return null;
    }
    const errorContainer = document.createElement('div');
    errorContainer.className = 'error-messages text-danger mb-3';
    errorContainer.style.display = 'none';
    section.prepend(errorContainer);
    return errorContainer;
}

document.querySelectorAll('.next-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        let inputs, errorContainer;
        if (steps[currentStep].id === 'address-step') {
            const currentSection = currentAddressStep === 0 ? document.querySelector('.address1') : document.querySelector('.address2');
            if (!currentSection) return;
            errorContainer = currentSection.querySelector('.error-messages') || createErrorContainer(currentSection);
            inputs = currentSection.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            if (currentAddressStep === 0) {
                if (!validateInputs(inputs, errorContainer)) return;
                switchToAddress(1);
                return;
            } else if (currentAddressStep === 1) {
                if (document.getElementById('differentShipping')?.checked) {
                    copyAddress1ToAddress2();
                } else if (!validateInputs(inputs, errorContainer)) {
                    return;
                }
                currentStep++;
                showStep(currentStep);
                return;
            }
        } else if (steps[currentStep].querySelector('.supplier1')) {
            const currentSection = currentSupplierStep === 0 ? document.querySelector('.supplier1') : document.querySelector('.supplier2');
            if (!currentSection) return;
            errorContainer = currentSection.querySelector('.error-messages') || createErrorContainer(currentSection);
            inputs = currentSection.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            if (currentSupplierStep === 0) {
                const bankSection = document.querySelector('.bank-details');
                const bankInputs = bankSection?.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
                const bankErrorContainer = bankSection?.querySelector('.error-messages') || createErrorContainer(bankSection);
                if (!validateInputs(bankInputs, bankErrorContainer)) return;
                if (!validateInputs(inputs, errorContainer)) return;
                switchToSupplier(1);
                return;
            } else if (currentSupplierStep === 1) {
                if (!validateInputs(inputs, errorContainer)) return;
                currentStep++;
                showStep(currentStep);
                return;
            }
        }
        inputs = steps[currentStep].querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
        errorContainer = steps[currentStep].querySelector('.error-messages') || createErrorContainer(steps[currentStep]);
        if (!validateInputs(inputs, errorContainer)) return;
        currentStep++;
        showStep(currentStep);
    });
});

document.querySelectorAll('.prev-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        if (currentStep > 0) {
            if (steps[currentStep].id === 'address-step' && currentAddressStep === 1) {
                switchToAddress(0);
            } else if (steps[currentStep].querySelector('.supplier1')) {
                if (currentSupplierStep === 1) {
                    switchToSupplier(0);
                } else {
                    const differentShipping = document.getElementById('differentShipping');
                    if (differentShipping?.checked) {
                        currentStep--;
                        currentAddressStep = 0;
                        showStep(currentStep);
                    } else {
                        currentStep--;
                        currentAddressStep = 1;
                        showStep(currentStep);
                    }
                }
            } else {
                if (currentStep === 5) {
                    const differentShipping = document.getElementById('differentShipping');
                    if (differentShipping?.checked) {
                        currentAddressStep = 0;
                    } else {
                        currentAddressStep = 1;
                    }
                }
                currentStep--;
                showStep(currentStep);
            }
        }
    });
});

paginationItems.forEach((item, index) => {
    item.addEventListener('click', () => {
        if (index === currentStep) return;

        if (index < currentStep) {
            currentStep = index;
            showStep(currentStep);
            return;
        }

        let inputs, errorContainer;
        if (steps[currentStep].id === 'address-step') {
            const currentSection = currentAddressStep === 0 ? document.querySelector('.address1') : document.querySelector('.address2');
            if (!currentSection) return;
            errorContainer = currentSection.querySelector('.error-messages') || createErrorContainer(currentSection);
            inputs = currentSection.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            if (currentAddressStep === 0) {
                if (!validateInputs(inputs, errorContainer)) return;
                switchToAddress(1);
                return;
            } else if (currentAddressStep === 1) {
                if (document.getElementById('differentShipping')?.checked) {
                    copyAddress1ToAddress2();
                } else if (!validateInputs(inputs, errorContainer)) {
                    return;
                }
                currentStep = index;
                showStep(currentStep);
                return;
            }
        } else if (steps[currentStep].querySelector('.supplier1')) {
            const currentSection = currentSupplierStep === 0 ? document.querySelector('.supplier1') : document.querySelector('.supplier2');
            if (!currentSection) return;
            errorContainer = currentSection.querySelector('.error-messages') || createErrorContainer(currentSection);
            inputs = currentSection.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            if (currentSupplierStep === 0 && index > currentStep) {
                const bankSection = document.querySelector('.bank-details');
                const bankInputs = bankSection?.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
                const bankErrorContainer = bankSection?.querySelector('.error-messages') || createErrorContainer(bankSection);
                if (!validateInputs(bankInputs, bankErrorContainer)) return;
                if (!validateInputs(inputs, errorContainer)) return;
                switchToSupplier(1);
                return;
            }
            if (!validateInputs(inputs, errorContainer)) return;
            currentStep = index;
            showStep(currentStep);
            return;
        } else {
            inputs = steps[currentStep].querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            errorContainer = steps[currentStep].querySelector('.error-messages') || createErrorContainer(steps[currentStep]);
            if (!validateInputs(inputs, errorContainer)) return;
            currentStep = index;
            showStep(currentStep);
        }
    });
});

document.getElementById('customerType')?.addEventListener('change', function () {
    const otherDiv = document.getElementById('otherCustomerTypeDiv');
    const otherInput = document.getElementById('otherCustomerType');
    if (!otherDiv || !otherInput) return;
    if (this.value === 'Others') {
        otherDiv.style.display = 'block';
        otherInput.setAttribute('required', true);
    } else {
        otherDiv.style.display = 'none';
        otherInput.removeAttribute('required');
        otherInput.value = '';
        otherInput.classList.remove('invalid', 'shake');
    }
    validateInputs([otherInput], document.querySelector('#customerInfoErrors'));
});

['fy_20_21', 'fy_21_22', 'fy_22_23'].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    input.addEventListener('input', function() {
        if (this.value.includes('.')) {
            const parts = this.value.split('.');
            if (parts[1].length > 2) {
                this.value = parts[0] + '.' + parts[1].slice(0, 2);
            }
        }
        if (this.value.replace('.', '').length > 8) {
            this.value = this.value.slice(0, 8 + (this.value.includes('.') ? 1 : 0));
        }
        validateInputs([this], this.closest('.form-step')?.querySelector('.error-messages'));
    });
});

function switchToAddress(step) {
    const address1 = document.querySelector('.address1');
    const address2 = document.querySelector('.address2');
    const breadcrumb1 = document.getElementById('breadcrumb1');
    const breadcrumb2 = document.getElementById('breadcrumb2');
    const differentShipping = document.getElementById('differentShipping');
    if (!address1 || !address2 || !breadcrumb1 || !breadcrumb2 || !differentShipping) return;

    if (step === 1) {
        const errorContainer = address1.querySelector('.error-messages') || createErrorContainer(address1);
        const inputs = address1.querySelectorAll('input, textarea, select, input[type="checkbox"], input[type="radio"]');
        if (!validateInputs(inputs, errorContainer)) return;
        address1.style.display = 'none';
        address2.style.display = 'block';
        breadcrumb1.classList.remove('active');
        breadcrumb2.classList.add('active');
        currentAddressStep = 1;
        if (differentShipping.checked) {
            copyAddress1ToAddress2();
        }
    } else {
        address2.style.display = 'none';
        address1.style.display = 'block';
        breadcrumb2.classList.remove('active');
        breadcrumb1.classList.add('active');
        currentAddressStep = 0;
    }
}

function copyAddress1ToAddress2() {
    const fields = [
        { from: 'business_address1', to: 'business_address2' },
        { from: 'pin1', to: 'pin2' },
        { from: 'city1', to: 'city2' },
        { from: 'state1', to: 'state2' },
        { from: 'country1', to: 'country2' },
        { from: 'contact1', to: 'contact2' },
        { from: 'phone1', to: 'phone2' },
        { from: 'fax1', to: 'fax2' },
        { from: 'email_id1', to: 'email_id2' },
        { from: 'designation1', to: 'designation2' },
        { from: 'mobile1', to: 'mobile2' }
    ];
    const errorContainer = document.querySelector('#address2Errors') || createErrorContainer(document.querySelector('.address2'));
    fields.forEach(field => {
        const fromInput = document.getElementById(field.from);
        const toInput = document.getElementById(field.to);
        if (fromInput && toInput) {
            toInput.value = fromInput.value;
            validateInputs([toInput], errorContainer);
        }
    });
}

function switchToSupplier(step) {
    const supplier1 = document.querySelector('.supplier1');
    const supplier2 = document.querySelector('.supplier2');
    const breadcrumb1 = document.getElementById('supplier_breadcrumb1');
    const breadcrumb2 = document.getElementById('supplier_breadcrumb2');
    if (!supplier1 || !supplier2 || !breadcrumb1 || !breadcrumb2) return;

    if (step === 1) {
        const bankSection = document.querySelector('.bank-details');
        const bankInputs = bankSection?.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
        const bankErrorContainer = bankSection?.querySelector('.error-messages') || createErrorContainer(bankSection);
        if (!validateInputs(bankInputs, bankErrorContainer)) return;

        const supplier1ErrorContainer = supplier1.querySelector('.error-messages') || createErrorContainer(supplier1);
        const supplier1Inputs = supplier1.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
        if (!validateInputs(supplier1Inputs, supplier1ErrorContainer)) return;

        supplier1.style.display = 'none';
        supplier2.style.display = 'block';
        breadcrumb1.classList.remove('active');
        breadcrumb2.classList.add('active');
        currentSupplierStep = 1;
    } else {
        supplier2.style.display = 'none';
        supplier1.style.display = 'block';
        breadcrumb2.classList.remove('active');
        breadcrumb1.classList.add('active');
        currentSupplierStep = 0;
    }
}

document.getElementById('differentShipping')?.addEventListener('change', function () {
    const address2 = document.querySelector('.address2');
    if (!address2) return;
    const inputs = address2.querySelectorAll('input, select, textarea');
    const stars = address2.querySelectorAll('.star');
    const errorContainer = address2.querySelector('.error-messages') || createErrorContainer(address2);
    if (this.checked) {
        copyAddress1ToAddress2();
        if (currentAddressStep === 1) {
            inputs.forEach(input => input.removeAttribute('required'));
            stars.forEach(star => star.style.display = 'none');
            currentStep++;
            showStep(currentStep);
        }
        address2.style.display = 'none';
    } else {
        address2.style.display = 'block';
        inputs.forEach(input => input.setAttribute('required', true));
        stars.forEach(star => star.style.display = 'inline');
        errorContainer.style.display = 'none';
        errorContainer.innerHTML = '';
    }
});

document.getElementById('copyAddress')?.addEventListener('click', () => {
    copyAddress1ToAddress2();
});

document.getElementById('breadcrumb1')?.addEventListener('click', () => switchToAddress(0));
document.getElementById('breadcrumb2')?.addEventListener('click', () => switchToAddress(1));
document.getElementById('nextToAddress2')?.addEventListener('click', () => switchToAddress(1));
document.getElementById('backToAddress1')?.addEventListener('click', () => switchToAddress(0));

document.getElementById('supplier_breadcrumb1')?.addEventListener('click', () => switchToSupplier(0));
document.getElementById('supplier_breadcrumb2')?.addEventListener('click', () => switchToSupplier(1));
document.getElementById('nextToSupplier2')?.addEventListener('click', () => switchToSupplier(1));
document.getElementById('backToSupplier1')?.addEventListener('click', () => switchToSupplier(0));

const yesRadio = document.getElementById('yes');
const noRadio = document.getElementById('no');
const creditDetails = document.getElementById('creditDetails');

if (yesRadio && noRadio && creditDetails) {
    yesRadio.addEventListener('change', function () {
        if (this.checked) {
            creditDetails.style.display = 'block';
            document.getElementById('Cummulative').setAttribute('required', true);
            document.getElementById('credit_limit_amount').setAttribute('required', true);
        }
    });
    noRadio.addEventListener('change', function () {
        if (this.checked) {
            creditDetails.style.display = 'none';
            document.getElementById('Cummulative').removeAttribute('required');
            document.getElementById('credit_limit_amount').removeAttribute('required');
        }
    });
}

const form = document.getElementById('customerForm');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    if (!submitBtn) {
        console.error('Submit button not found');
        return;
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';
    console.log('Form submission started');

    let isValid = true;
    let validationErrors = [];
    steps.forEach((step, index) => {
        let inputs, errorContainer;
        if (step.id === 'address-step') {
            const address1 = document.querySelector('.address1');
            errorContainer = address1.querySelector('.error-messages') || createErrorContainer(address1);
            inputs = address1.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            if (!validateInputs(inputs, errorContainer)) {
                isValid = false;
                validationErrors.push('Address 1 validation failed');
                currentStep = index;
                currentAddressStep = 0;
                showStep(currentStep);
                return;
            }
            if (!document.getElementById('differentShipping')?.checked) {
                const address2 = document.querySelector('.address2');
                errorContainer = address2.querySelector('.error-messages') || createErrorContainer(address2);
                inputs = address2.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
                if (!validateInputs(inputs, errorContainer)) {
                    isValid = false;
                    validationErrors.push('Address 2 validation failed');
                    currentStep = index;
                    currentAddressStep = 1;
                    showStep(currentStep);
                    return;
                }
            }
        } else if (step.querySelector('.supplier1')) {
            const supplier1 = document.querySelector('.supplier1');
            const supplier2 = document.querySelector('.supplier2');
            const bankSection = document.querySelector('.bank-details');
            errorContainer = bankSection.querySelector('.error-messages') || createErrorContainer(bankSection);
            inputs = bankSection.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            if (!validateInputs(inputs, errorContainer)) {
                isValid = false;
                validationErrors.push('Bank details validation failed');
                currentStep = index;
                showStep(currentStep);
                return;
            }
            errorContainer = supplier1.querySelector('.error-messages') || createErrorContainer(supplier1);
            inputs = supplier1.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            if (!validateInputs(inputs, errorContainer)) {
                isValid = false;
                validationErrors.push('Supplier 1 validation failed');
                currentStep = index;
                showStep(currentStep);
                return;
            }
            errorContainer = supplier2.querySelector('.error-messages') || createErrorContainer(supplier2);
            inputs = supplier2.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            if (!validateInputs(inputs, errorContainer)) {
                isValid = false;
                validationErrors.push('Supplier 2 validation failed');
                currentStep = index;
                currentSupplierStep = 1;
                showStep(currentStep);
                return;
            }
        } else {
            inputs = step.querySelectorAll('input, select, textarea, input[type="checkbox"], input[type="radio"]');
            errorContainer = step.querySelector('.error-messages') || createErrorContainer(step);
            if (!errorContainer) {
                console.error('Failed to create error container for step:', step);
                validationErrors.push('Error container missing for step ' + index);
                return;
            }
            if (!validateInputs(inputs, errorContainer)) {
                isValid = false;
                validationErrors.push('Step ' + (index + 1) + ' validation failed');
                currentStep = index;
                showStep(currentStep);
                return;
            }
        }
    });

    if (!isValid) {
        console.log('Validation errors:', validationErrors);
        alert('Please fix the following validation errors:\n' + validationErrors.join('\n'));
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        return;
    }

    const requiredFields = ['sales_name', 'customer_name', 'company_name', 'supplier1_name', 'supplier2_name'];
    const missingFields = requiredFields.filter(id => !document.getElementById(id)?.value.trim());
    if (missingFields.length > 0) {
        alert(`Missing required fields: ${missingFields.join(', ')}`);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        return;
    }

    const formData = {
        sales_name: document.getElementById('sales_name')?.value || '',
        emp_id: document.getElementById('emp_id')?.value || '',
        sales_email: document.getElementById('sales_email')?.value || '',
        customer_name: document.getElementById('customer_name')?.value || '',
        company_name: document.getElementById('company_name')?.value || '',
        commercial_name: document.getElementById('commercial_name')?.value || '',
        customer_address: document.getElementById('customer_address')?.value || '',
        customerType: document.getElementById('customerType')?.value || '',
        otherCustomerType: document.getElementById('otherCustomerType')?.value || '',
        Category: document.getElementById('Category')?.value || '',
        pan: document.getElementById('pan')?.value || '',
        gst: document.getElementById('gst')?.value || '',
        year_incorporation: document.getElementById('year_incorporation')?.value || '',
        area: document.getElementById('area')?.value || '',
        range: document.getElementById('range')?.value || '',
        Association_HBL: document.getElementById('Association_HBL')?.value || '',
        partner_company_name: document.getElementById('partner_company_name')?.value || '',
        Status: document.getElementById('Status')?.value || '',
        fy_20_21: document.getElementById('fy_20_21')?.value || '',
        fy_21_22: document.getElementById('fy_21_22')?.value || '',
        fy_22_23: document.getElementById('fy_22_23')?.value || '',
        branches_name: document.getElementById('branches_name')?.value || '',
        sister_Company_name: document.getElementById('sister_Company_name')?.value || '',
        photo: await convertToBase64(document.getElementById('photo')?.files[0], 'photo'),
        sign: await convertToBase64(document.getElementById('sign')?.files[0], 'sign'),
        address1: {
            business_address1: document.getElementById('business_address1')?.value || '',
            pin1: document.getElementById('pin1')?.value || '',
            city1: document.getElementById('city1')?.value || '',
            state1: document.getElementById('state1')?.value || '',
            country1: document.getElementById('country1')?.value || '',
            contact1: document.getElementById('contact1')?.value || '',
            phone1: document.getElementById('phone1')?.value || '',
            fax1: document.getElementById('fax1')?.value || '',
            email_id1: document.getElementById('email_id1')?.value || '',
            designation1: document.getElementById('designation1')?.value || '',
            mobile1: document.getElementById('mobile1')?.value || ''
        },
        address2: {
            business_address2: document.getElementById('business_address2')?.value || '',
            pin2: document.getElementById('pin2')?.value || '',
            city2: document.getElementById('city2')?.value || '',
            state2: document.getElementById('state2')?.value || '',
            country2: document.getElementById('country2')?.value || '',
            contact2: document.getElementById('contact2')?.value || '',
            phone2: document.getElementById('phone2')?.value || '',
            fax2: document.getElementById('fax2')?.value || '',
            email_id2: document.getElementById('email_id2')?.value || '',
            designation2: document.getElementById('designation2')?.value || '',
            mobile2: document.getElementById('mobile2')?.value || ''
        },
        differentShipping: document.getElementById('differentShipping')?.checked || false,
        bank_name: document.getElementById('bank_name')?.value || '',
        acc_number: document.getElementById('acc_number')?.value || '',
        acc_type: document.getElementById('acc_type')?.value || '',
        branch_name: document.getElementById('branch_name')?.value || '',
        ifsc: document.getElementById('ifsc')?.value || '',
        limits: document.getElementById('limits')?.value || '',
        security_cheque: document.getElementById('security_cheque')?.value || '',
        pdc_cheque: document.getElementById('pdc_cheque')?.value || '',
        supplier1_name: document.getElementById('supplier1_name')?.value || '',
        supplier1_address: document.getElementById('supplier1_address')?.value || '',
        supplier1_phone: document.getElementById('supplier1_phone')?.value || '',
        supplier1_contact: document.getElementById('supplier1_contact')?.value || '',
        supplier1_payment: document.getElementById('supplier1_payment')?.value || '',
        supplier2_name: document.getElementById('supplier2_name')?.value || '',
        supplier2_address: document.getElementById('supplier2_address')?.value || '',
        supplier2_phone: document.getElementById('supplier2_phone')?.value || '',
        supplier2_contact: document.getElementById('supplier2_contact')?.value || '',
        supplier2_payment: document.getElementById('supplier2_payment')?.value || '',
        designation: document.getElementById('designation')?.value || '',
        date: document.getElementById('date')?.value || '',
        requesting_branch: document.getElementById('requesting_branch')?.value || '',
        division: document.getElementById('division')?.value || '',
        credit_limit_req: document.getElementById('credit_limit_req')?.value || '',
        sales_head: document.getElementById('sales_head')?.value || '',
        sales_ho: document.getElementById('sales_ho')?.value || '',
        estm: document.getElementById('estm')?.value || '',
        Requests: document.getElementById('Requests')?.value || '',
        code_number: document.getElementById('code_number')?.value || '',
        existing_code: document.getElementById('existing_code')?.value || '',
        credit_limit_radio: document.querySelector('input[name="credit_limit_radio"]:checked')?.value || null,
        credit_limit_amount: document.getElementById('credit_limit_amount')?.value || '',
        Cummulative: document.getElementById('Cummulative')?.value || '',
        credit_limit: document.getElementById('credit_limit')?.value || '',
        account_request: document.getElementById('account_request')?.value || '',
        account_request_name: document.getElementById('account_request_name')?.value || '',
        account_authorized: document.getElementById('account_authorized')?.value || '',
        account_authorized_name: document.getElementById('account_authorized_name')?.value || '',
        account_checked: document.getElementById('account_checked')?.value || '',
        account_checked_name: document.getElementById('account_checked_name')?.value || '',
        credit_approved: document.getElementById('credit_approved')?.value || ''
    };

    console.log('Form data:', JSON.stringify(formData, null, 2));

    try {
        console.log('Sending fetch request to backend...');
        const response = await fetch('http://localhost:3000/submit-form', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        console.log('Response status:', response.status);
        const result = await response.json();
        console.log('Response body:', JSON.stringify(result, null, 2));
        if (response.ok) {
            alert('Form submitted successfully!');
            form.reset();
            currentStep = 0;
            currentAddressStep = 0;
            currentSupplierStep = 0;
            const differentShipping = document.getElementById('differentShipping');
            if (differentShipping) {
                differentShipping.checked = false;
            }
            const creditDetails = document.getElementById('creditDetails');
            if (creditDetails) {
                creditDetails.style.display = 'none';
            }
            const otherCustomerTypeDiv = document.getElementById('otherCustomerTypeDiv');
            if (otherCustomerTypeDiv) {
                otherCustomerTypeDiv.style.display = 'none';
            }
            document.querySelectorAll('.error-messages').forEach(container => {
                container.innerHTML = '';
                container.style.display = 'none';
            });
            document.querySelectorAll('.invalid, .shake').forEach(el => {
                el.classList.remove('invalid', 'shake');
            });
            showStep(currentStep);
        } else {
            if (response.status === 409 && result.error.includes('PAN number already exists')) {
                alert('Error: A customer with this PAN number already exists. Please use a different PAN or contact support.');
                const panStep = Array.from(steps).findIndex(step => step.querySelector('#pan'));
                currentStep = panStep >= 0 ? panStep : 1;
                showStep(currentStep);
                const panInput = document.getElementById('pan');
                if (panInput) {
                    panInput.classList.add('invalid', 'shake');
                    const errorContainer = panInput.closest('.form-step')?.querySelector('.error-messages');
                    if (errorContainer) {
                        errorContainer.innerHTML = '<p>PAN number already exists.</p>';
                        errorContainer.style.display = 'block';
                    }
                }
            } else {
                alert(`Error: ${result.error || result.message || 'Unknown error'}`);
            }
        }
    } catch (e) {
        console.error('Submission error:', e);
        alert(`Error submitting form: ${e.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
        console.log('Submit button re-enabled');
    }
});

async function convertToBase64(file, inputId) {
    if (!file) {
        if (document.getElementById(inputId)?.required) {
            const errorContainer = document.getElementById(inputId)?.closest('.form-step')?.querySelector('.error-messages');
            if (errorContainer) {
                errorContainer.innerHTML = `<p>${inputId === 'photo' ? 'Photo' : 'Sign'} is required.</p>`;
                errorContainer.style.display = 'block';
            }
        }
        return null;
    }
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    }).catch(error => {
        console.error('File reading error for', inputId, ':', error);
        const errorContainer = document.getElementById(inputId)?.closest('.form-step')?.querySelector('.error-messages');
        if (errorContainer) {
            errorContainer.innerHTML = `<p>Error reading ${inputId === 'photo' ? 'photo' : 'sign'} file.</p>`;
            errorContainer.style.display = 'block';
        }
        return null;
    });
}

showStep(currentStep);