export default function Footer() {
  return (
    <footer className="bg-neutral-800 text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4 font-inter">PA Checker</h3>
            <p className="text-neutral-300 text-sm">
              This tool allows you to check coverage and prior authorization requirements across multiple formularies.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 font-inter">Important Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="text-neutral-300 hover:text-white">
                  Provider Portal
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-300 hover:text-white">
                  Full Formulary PDF
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-300 hover:text-white">
                  PA Forms
                </a>
              </li>
              <li>
                <a href="#" className="text-neutral-300 hover:text-white">
                  Contact Pharmacy Services
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-4 font-inter">Disclaimer</h3>
            <p className="text-neutral-300 text-sm">
              This tool is for informational purposes only. Always verify coverage and requirements 
              through official channels before prescribing.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t border-neutral-600 text-center text-sm text-neutral-400">
          <p>© {new Date().getFullYear()} Formulary PA Checker. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
