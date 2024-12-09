Digital Identity Verification DApp

Team Members • Sri Hari Dheeraj Kommineni o CWID: 885177196 o Email:
dheerajkommineni@csu.fullerton.edu • Tarun Sai Vuppala o CWID: 827778861 o
Email: tarunsai@csu.fullerton.edu • Hemanth Naidu Karnataka o CWID: 885177238 o
Email: hemanth_karnataka@csu.fullerton.edu • Ashish Kottakota o CWID: 878640879
o Email: kottakotaashish@csu.fullerton.edu • Sai Sirisha Surapaneni o CWID:
885176834 o Email: siri23@csu.fullerton.edu

Project Overview: The Digital Identity Verification DApp is a decentralized
application designed to simplify and secure the process of verifying identities,
credentials, and other related data using blockchain technology. This DApp
enables transparent, tamper-proof verification and enhances trust between
applicants, institutions, and employers.

Key Features:

1. Employer and Institution Registration: o Employers and institutions can
   register themselves on the blockchain, ensuring authenticity.
2. Resume Verification: o Employers and institutions can request and verify
   credentials stored in resumes uploaded by applicants.
3. Dynamic Contract Address Handling: o Newly deployed contract addresses are
   dynamically read from the deployment process, eliminating the need to
   hardcode them in the application.
4. Deployed on a Public Testnet: o The DApp is fully functional and deployed on
   a public Ethereum testnet.

Built From Scratch: This project was developed entirely from scratch. No
existing codebase was used or modified. All components, including the smart
contracts, frontend, and backend, were created independently for this project.

How to Run the Project:

1. Clone the Repository: bash Copy code git clone
   https://github.com/DheerajKommineni/DigitalIdentityVerifcation_DApp.git cd
   DigitalIdentityVerifcation_DApp
2. Install Dependencies: o For the backend: bash Copy code cd my-app-backend npm
   install o For the frontend: bash Copy code cd
   ../digitalidentity-verification-dapp npm install
3. Set Up Environment Variables: o Create a .env file in the my-app-backend
   directory with the following details: makefile Copy code DB_HOST=localhost
   DB_USER=root DB_PASS=your_mysql_password
   DB_NAME=digital_identity_verification PORT=5001
4. Start Ganache (Local Blockchain): o Make sure your local blockchain is
   running on http://127.0.0.1:7545.
5. Deploy Smart Contracts: o Navigate to the root directory and run: bash Copy
   code truffle migrate --reset
6. Start the Backend Server: o In the my-app-backend directory, start the
   backend: bash Copy code node server.js
7. Start the Frontend Application: o In the digitalidentity-verification-dapp
   directory, start the React app: bash Copy code npm start
8. Access the Application: o Open the application in your browser at
   http://localhost:3000.

Repository Link:
https://github.com/DheerajKommineni/DigitalIdentityVerifcation_DApp.git
