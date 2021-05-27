//create variable to hold db connection
let db;

//establish a connection to IndexDB called pizza_hunt and set it to version 1
const request = indexedDB.open('pizza_hunt', 1);

//trigger event listener if db version changes
request.onupgradeneeded = function(event) {
     //save reference to database
     const db = event.target.result;
     //create an object store (table) called new_pizza, set it to have auto-increment primary key
     db.createObjectStore('new_pizza', { autoIncrement: true });
};

//upon successful
request.onsuccess = function(event) {
     //when db is successfully created with its object store from onupgradeneeded event or new connection, save reference to db
     db = event.target.result;

     //check if app is online, then run uploadPizza() to send all local db data to api
     if(navigator.onLine) {
          uploadPizza();
     }
};

request.onerror = function(event) {
     console.log(event.target.errorCode);
}

//This will be executed if we attempt to submit a new pizza and there's  no internet connection
function saveRecord(record) {
     //open a new transaction with the database with read and write permissions
     const transaction = db.transaction(['new_pizza'], 'readwrite');

     //access object store for new_pizza
     const pizzaObjectStore = transaction.objectStore('new_pizza');

     //add record to your store with add method
     pizzaObjectStore.add(record);
};

function uploadPizza() {
     //open a transaction on the database
     const transaction = db.transaction(['new_pizza'], 'readwrite');

     //access object store
     const pizzaObjectStore = transaction.objectStore('new_pizza');

     //get all records and set to variable
     const getAll = pizzaObjectStore.getAll();

     //upon successful getAll, run this
     getAll.onsuccess = function() {
          //if there was data in the object store, send to api
          if (getAll.result.length > 0) {
               fetch('/api/pizzas', {
                    method: 'POST',
                    body: JSON.stringify(getAll.result),
                    headers: {
                         Accept: 'application/json, text/plain, */*',
                         'Content-Type': 'application/json'
                    }
               })
               .then(response => response.json())
               .then(serverResponse => {
                    if (serverResponse.message) {
                         throw new Error(serverResponse);
                    }
                    //open another transaction
                    const transaction = db.transaction(['new_pizza'], 'readwrite');

                    //access object store
                    const pizzaObjectStore = transaction.objectStore('new_pizza');
                    //clear all items in store
                    pizzaObjectStore.clear();

                    alert('All saved pizza data has been submitted.');
               })
               .catch(err => {
                    console.log(err);
               });
          };
     };
};

//listen for app to come online
window.addEventListener('online', uploadPizza);