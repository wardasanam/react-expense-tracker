# **React Expense Tracker with Firebase**

A modern and feature-rich personal expense tracker application built with React, Firebase, and Tailwind CSS. This web application allows users to securely track their income and expenses, visualize their spending habits, and manage their personal finances with ease.

## **✨ Key Features**

* **User Authentication:** Secure sign-up and login functionality powered by Firebase Authentication.  
* **Real-time Database:** All transaction data is stored and synced in real-time using Cloud Firestore, allowing for a seamless experience across devices.  
* **Full CRUD Functionality:** Users can Create, Read, Update, and Delete their income and expense transactions.  
* **Monthly Navigation:** Easily browse through transaction history month by month.  
* **Interactive Dashboard:** A clear summary of total income, expenses, and current balance.  
* **Data Visualization:** An interactive doughnut chart provides a clear breakdown of spending by category.  
* **Customization:**  
  * **Light & Dark Mode:** Toggle between themes for comfortable viewing.  
  * **Multi-Currency Support:** Choose from a variety of currency symbols.  
* **Filtering:** Filter transactions to view all, only income, or only expenses for the selected month.  
* **Responsive Design:** A clean and modern UI that works beautifully on all screen sizes, from mobile to desktop.

## **🛠️ Tech Stack**

* **Frontend:** React.js  
* **Backend & Database:** Firebase (Authentication & Cloud Firestore)  
* **Styling:** Tailwind CSS  
* **Charts:** Chart.js  
* **Icons:** Lucide React

## **🚀 Getting Started**

To get a local copy up and running, follow these simple steps.

### **Prerequisites**

* Node.js installed on your machine  
* A Firebase project with Authentication and Firestore enabled

### **Installation**

1. **Clone the repository:**  
   git clone \[https://github.com/your-username/your-repo-name.git\](https://github.com/your-username/your-repo-name.git)

2. **Navigate into the project directory:**  
   cd your-repo-name

3. **Install NPM packages:**  
   npm install

4. **Set up Firebase credentials:**  
   * In the src/ folder, find the App.js file.  
   * Locate the firebaseConfig object (around line 25).  
   * Replace the placeholder values ("YOUR\_API\_KEY", etc.) with your actual configuration keys from your Firebase project dashboard.  
5. **Run the application:**  
   npm start

The app will now be running on http://localhost:3000.