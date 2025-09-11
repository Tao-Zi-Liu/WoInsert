# **App Name**: TaskMaster Pro

## Core Features:

- User Authentication: Secure user login using Firebase Authentication with pre-defined credentials.
- Dynamic Table Management: Enable users to add and delete rows in a table with editable fields: WO_WOID, WO_WLID, WO_XQSL, WO_JHKGRQ, WO_JHWGRQ, and WO_BMID.
- Data Validation: Validate data inputs, including WO_XQSL as a number greater than 0, preventing duplicate WO_WOID entries in the current form, and checking WO_WOID and WO_WLID against the Firestore database. Incorporate reasonining to validate against missing values.
- Default Value Insertion: Automatically insert default values for WO_GCID, WO_LX, WO_ZT, WO_DZSC, WO_WHRID, and WO_WHSJ (current Beijing time) upon submission.
- Template Download: Allow users to download an .xlsx template that matches the form's structure.
- File Import: Support importing data from .xlsx files to populate the table.
- Historical Records View: Display a real-time view of submitted production task orders using onSnapshot listeners from Firestore, with navigation back to the main form.

## Style Guidelines:

- Primary color: Navy blue (#2E4A62) for a professional and reliable feel.
- Background color: Light gray (#F0F4F7) to provide a clean, neutral backdrop.
- Accent color: Sky blue (#72BCD4) for interactive elements and highlights.
- Body and headline font: 'Inter', a sans-serif for modern clarity.
- Use simple, outlined icons to represent different data management functions.
- Implement a clean, tabular layout for data input and display.
- Use subtle transitions and feedback animations on data entry and submission actions.