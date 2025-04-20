import { SVGProps } from "react";

interface MolinaLogoProps extends SVGProps<SVGSVGElement> {}

export default function MolinaLogo(props: MolinaLogoProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <rect width="100" height="100" rx="10" fill="#0078D4" />
      <path
        d="M20 30H35C40.523 30 45 34.477 45 40V70H30C24.477 70 20 65.523 20 60V30Z"
        fill="white"
      />
      <path
        d="M50 30H65C70.523 30 75 34.477 75 40V70H60C54.477 70 50 65.523 50 60V30Z"
        fill="white"
      />
      <path
        d="M80 30H85C90.523 30 95 34.477 95 40V70H80V30Z"
        fill="white"
      />
      <path
        d="M15 30H20V70H15C9.477 70 5 65.523 5 60V40C5 34.477 9.477 30 15 30Z"
        fill="white"
      />
    </svg>
  );
}
