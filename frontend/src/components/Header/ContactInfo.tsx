import React from "react";
import { Phone } from "lucide-react";

const ContactInfo: React.FC = () => {
  return (
    <div className="hidden md:flex items-center space-x-4 text-white text-lg">
      <Phone className="h-6 w-6 mr-2" />
      <span>Liên hệ hỗ trợ 1900 2154</span>
    </div>
  );
};

export default ContactInfo;
