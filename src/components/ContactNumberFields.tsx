"use client";

import { localPhoneNumber } from "@/lib/contact-details";

export type ContactForm = { phone: string; whatsappNumber: string; whatsappSameAsPhone: boolean };

export function ContactNumberFields({ value, onChange, idPrefix, required = false, disabled = false }: {
  value: ContactForm; onChange: (value: ContactForm) => void; idPrefix: string; required?: boolean; disabled?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-phone`} className="field-label">Phone number{!required && " (optional)"}</label>
        <PhoneNumberInput id={`${idPrefix}-phone`} value={value.phone} required={required} disabled={disabled}
          onChange={(phone) => onChange({ ...value, phone, whatsappNumber: value.whatsappSameAsPhone ? phone : value.whatsappNumber })} />
      </div>
      <label className="flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border border-hairline bg-mist/50 p-3.5 text-sm">
        <input type="checkbox" checked={value.whatsappSameAsPhone} disabled={disabled}
          onChange={(event) => onChange({ ...value, whatsappSameAsPhone: event.target.checked, whatsappNumber: event.target.checked ? value.phone : value.whatsappNumber })}
          className="mt-0.5 size-4 shrink-0 accent-electric" />
        <span><span className="block font-semibold text-night">Use the same number for WhatsApp</span><span className="mt-0.5 block text-xs text-slate-text">Your WhatsApp number will update when you change your phone number.</span></span>
      </label>
      {!value.whatsappSameAsPhone ? (
        <div>
          <label htmlFor={`${idPrefix}-whatsapp`} className="field-label">WhatsApp number{!required && " (optional)"}</label>
          <PhoneNumberInput id={`${idPrefix}-whatsapp`} value={value.whatsappNumber} required={required} disabled={disabled}
            onChange={(whatsappNumber) => onChange({ ...value, whatsappNumber })} />
        </div>
      ) : value.phone && <p className="text-sm text-slate-text">WhatsApp: <span className="font-semibold text-night">+880 {localPhoneNumber(value.phone) || value.phone}</span></p>}
    </div>
  );
}

function PhoneNumberInput({ id, value, onChange, required, disabled }: { id: string; value: string; onChange: (value: string) => void; required: boolean; disabled: boolean }) {
  return (
    <>
      <div className="flex min-w-0">
        <span className="inline-flex items-center rounded-l-[14px] border border-r-0 border-hairline bg-mist px-3.5 text-sm font-semibold text-slate-text" aria-hidden>+880</span>
        <input id={id} name={id} type="tel" inputMode="tel" autoComplete="tel-national" className="field min-w-0 rounded-l-none" value={value}
          onChange={(event) => onChange(event.target.value)} placeholder="1712 345678" maxLength={25} required={required} disabled={disabled} aria-describedby={`${id}-hint`} />
      </div>
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-slate-text">Bangladesh mobile number. You can include the leading 0.</p>
    </>
  );
}
