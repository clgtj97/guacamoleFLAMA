export function Create() {
  return (
    <div className="isolate bg-white px-6 py-24 sm:py-32 lg:px-8">
      {/* Changed background decoration to green gradient */}
      <div className="absolute inset-x-0 top-[-10rem] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[-20rem]" aria-hidden="true">
        <div 
          className="relative left-1/2 -z-10 aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#4ade80] to-[#22d3ee] opacity-30 sm:left-[calc(50%-40rem)] sm:w-[72.1875rem]" 
          style={{ clipPath: "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}
        ></div>
      </div>

      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-4xl font-semibold tracking-tight text-balance text-gray-900 sm:text-5xl">New Escrow Transaction</h2>
        <p className="mt-2 text-lg/8 text-gray-600">Select both your Transaction Style and your Position to get started.</p>
      </div>

      <form className="mx-auto mt-16 max-w-xl sm:mt-20">
        <div className="space-y-6">
          {/* Field 1: Transaction Style */}
          <div>
            <label htmlFor="transactionStyle" className="block text-sm/6 font-semibold text-gray-900">
              Transaction style
            </label>
            <div className="mt-2.5">
              <select
                id="transactionStyle"
                name="transactionStyle"
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600"
              >
                <option value="">Select a style</option>
                <option value="ordinals">Ordinals</option>
                <option value="domain">Runes</option>
                <option value="services">Services</option>
                <option value="domain">Domain</option>
                <option value="automotive">Automotive</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Field 2: Position */}
          <div>
            <label htmlFor="position" className="block text-sm/6 font-semibold text-gray-900">
              Your Position
            </label>
            <div className="mt-2.5">
              <select
                id="position"
                name="position"
                className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600"
              >
                <option value="">Select a Position</option>
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
                <option value="broker">Broker</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-10">
          <button
            type="submit"
            className="block w-full rounded-md bg-green-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-xs hover:bg-green-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
          >
            Submit Request
          </button>
        </div>
      </form>
    </div>
  );
}