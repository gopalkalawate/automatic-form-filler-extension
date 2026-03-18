/**
 * scanner.ts
 * 
 * Responsible strictly for finding input fields on the page and extracting their metadata.
 * Does NOT modify the DOM.
 */

export interface FormFieldData {
  id: string;
  name: string;
  placeholder: string;
  ariaLabel: string;
  type: string;
}

const scanForFields = (): Record<string, FormFieldData> => {
  const fieldsMap: Record<string, FormFieldData> = {};
  
  // Select common input elements
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select');

  inputs.forEach((element, index) => {
    const el = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    
    // Create a unique key for the element. Prefer ID, then Name, then a fallback index.
    const uniqueKey = el.id || el.name || `field_${index}`;
    
    fieldsMap[uniqueKey] = {
      id: el.id || '',
      name: el.name || '',
      placeholder: (el as HTMLInputElement | HTMLTextAreaElement).placeholder || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      type: el.tagName.toLowerCase() === 'input' ? el.type : el.tagName.toLowerCase()
    };
  });

  return fieldsMap;
};

// Listen for messages from the background script or popup
chrome.runtime.onMessage.addListener((request: any, _sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
  if (request.action === 'SCAN_FIELDS') {
    const fields = scanForFields();
    console.log('[PatientVoiceFiller] Scanned fields:', fields);
    sendResponse({ fields });
  }
  return true; // Keep message channel open for async response
});
