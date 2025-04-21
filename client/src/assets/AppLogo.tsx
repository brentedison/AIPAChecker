import { SVGProps } from "react";

interface AppLogoProps extends SVGProps<SVGSVGElement> {}

export default function AppLogo(props: AppLogoProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path 
        d="M32 8l24 12v24l-24 12L8 44V20L32 8z" 
        fill="#0078D4" 
        stroke="#0078D4"
      />
      <path 
        d="M24 31.9996C24 29.7905 25.7909 27.9996 28 27.9996H36C38.2091 27.9996 40 29.7905 40 31.9996V39.9996C40 42.2087 38.2091 43.9996 36 43.9996H28C25.7909 43.9996 24 42.2087 24 39.9996V31.9996Z" 
        fill="white" 
        stroke="white"
      />
      <path 
        d="M24 22C24 20.8954 24.8954 20 26 20H38C39.1046 20 40 20.8954 40 22V24C40 25.1046 39.1046 26 38 26H26C24.8954 26 24 25.1046 24 24V22Z" 
        fill="white" 
        stroke="white"
      />
    </svg>
  );
}