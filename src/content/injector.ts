/**
 * injector.ts
 * 
 * Responsible strictly for receiving mapped form data and populating the correct form fields.
 * Dispatches simulated input/change events to support JS framework binding (React, Angular).
 */

const injectFormData = (mappedValues: Record<string, string>) => {
    
  Object.entries(mappedValues).forEach(([key, value]) => {
    if (!value || value === "null") return;

    let el: HTMLInputElement | null = null;

    if (document.getElementById(key)) {
        el = document.getElementById(key) as HTMLInputElement;
    } else {
        const byName = document.getElementsByName(key);
        if (byName.length > 0) {
            el = byName[0] as HTMLInputElement;
        } else {
            console.warn(`[PatientVoiceFiller] Element with id or name "${key}" not found for value "${value}"`);
        }
    }

    if (el) {
        // Set the value using the native setter to bypass React's state management override
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLInputElement.prototype,
            'value'
        )?.set;
        
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            'value'
        )?.set;

        if (el instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
            nativeTextAreaValueSetter.call(el, value);
        } else if (nativeInputValueSetter) {
            nativeInputValueSetter.call(el, value);
        } else {
            el.value = value;
        }

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

};

// Listen for messages from background/popup
chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (request.action === 'INJECT_FIELDS') {
    const { mappedValues } = request;
    console.log('[PatientVoiceFiller] Injecting mapped fields:', mappedValues);
    try {
        injectFormData(mappedValues);
        sendResponse({ success: true });
    } catch(err: any) {
        sendResponse({ success: false, error: err.message });
    }
  }
  return true;
});
