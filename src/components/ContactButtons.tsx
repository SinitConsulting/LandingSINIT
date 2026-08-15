import React, { useState, useRef } from 'react';
import { siteInfo } from '../data/content';

interface ContactButtonsProps {
  sectionOrigin: string;
  serviceInterest?: string;
  page?: string;
}

export default function ContactButtons({ 
  sectionOrigin, 
  serviceInterest = "general", 
  page = "/" 
}: ContactButtonsProps) {
  const [honeypot, setHoneypot] = useState("");
  const isSubmitting = useRef(false);

  const handleContact = async (canal: "whatsapp" | "correo", e: React.MouseEvent) => {
    // Prevent default anchor behavior immediately to handle async our way
    e.preventDefault();

    // Check debounce
    const lastSubmitStr = sessionStorage.getItem("lastContactSubmit");
    const now = Date.now();
    if (lastSubmitStr) {
      const lastSubmit = parseInt(lastSubmitStr, 10);
      if (now - lastSubmit < 5000) {
        // Debounced: just redirect without sending new fetch
        redirect(canal);
        return;
      }
    }

    if (isSubmitting.current) return;
    isSubmitting.current = true;
    sessionStorage.setItem("lastContactSubmit", now.toString());

    // Prepare payload
    const payload = {
      canal,
      seccion_origen: sectionOrigin,
      servicio_interes: serviceInterest,
      pagina: page,
      timestamp: new Date().toISOString(),
      honeypot
    };

    // Fire & Forget: we don't await this before redirecting
    fetch("/api/lead", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    }).catch(err => console.error("Error submitting lead data:", err));

    // Redirect immediately
    redirect(canal);
    
    // Reset submitting lock after a short delay
    setTimeout(() => {
      isSubmitting.current = false;
    }, 1000);
  };

  const redirect = (canal: "whatsapp" | "correo") => {
    if (canal === "whatsapp") {
      const url = `https://wa.me/${siteInfo.whatsappNumber}?text=${encodeURIComponent(siteInfo.whatsappMessage)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = `mailto:${siteInfo.email}`;
    }
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center mt-6">
      {/* Honeypot field - Hidden from screen readers and visual flow */}
      <div aria-hidden="true" className="absolute opacity-0 -z-10 select-none pointer-events-none">
        <label htmlFor="bot-field">No llenar si eres humano</label>
        <input 
          type="text" 
          id="bot-field"
          name="bot-field" 
          tabIndex={-1} 
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      <a 
        href={`https://wa.me/${siteInfo.whatsappNumber}?text=${encodeURIComponent(siteInfo.whatsappMessage)}`}
        onClick={(e) => handleContact("whatsapp", e)}
        className="inline-flex justify-center items-center gap-2 px-6 py-3 bg-[#2ac4b0] hover:bg-[#22a392] text-[#0F172A] font-bold rounded-lg transition-colors w-full sm:w-auto shadow-lg"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
        </svg>
        WhatsApp
      </a>

      <a 
        href={`mailto:${siteInfo.email}`}
        onClick={(e) => handleContact("correo", e)}
        className="inline-flex justify-center items-center gap-2 px-6 py-3 border-2 border-[#2ac4b0] text-[#2ac4b0] hover:bg-[#2ac4b0]/10 font-bold rounded-lg transition-colors w-full sm:w-auto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="16" x="2" y="4" rx="2"></rect>
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
        </svg>
        Correo electrónico
      </a>
    </div>
  );
}
