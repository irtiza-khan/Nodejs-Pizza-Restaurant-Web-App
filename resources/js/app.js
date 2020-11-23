import axios from 'axios';
import Noty from 'noty';
import { initAdmin } from './admin.js';
import moment from 'moment';
const cartBtn = document.querySelectorAll('.add-to-cart');
const cartCounter = document.querySelector('#cartCounter');
//sending data to backend 
const updateCart = async(pizza) => {
    try {

        const res = await axios.post('/update-cart', pizza);
        cartCounter.innerText = res.data.totalQty;
        //Notify the User 
        new Noty({
            type: 'warning',
            layout: 'topRight',
            timeout: 1000,
            text: 'Pizza Added to Cart',
            progressBar: false

        }).show();

    } catch (err) {

        new Noty({
            type: 'error',
            layout: 'topRight',
            timeout: 1000,
            text: 'Something Went Wrong',
            progressBar: false

        }).show();



    }

}

cartBtn.forEach(btn => {
    btn.addEventListener('click', (e) => {
        let pizzaData = JSON.parse(btn.dataset.pizza);
        //console.log(pizzaData);
        updateCart(pizzaData);


    })
})


const alertMsg = document.getElementById('success-alert ');
if (alertMsg) {
    setTimeout(() => {
        alertMsg.remove();
    }, 3000);
}



initAdmin();

//Change Order Status
const input = document.querySelector('#hiddenInput')
const statuses = document.querySelector('.status_line')
let order = input ? input.value : null;
order = JSON.parse(order);
let time = document.createElement('small');
console.log(order);

function updateOrder(order) {
    let stepCompleted = true;
    statuses.forEach((status) => {
        let statusProp = status.dataset.status;
        if (stepCompleted) {

            status.classList.add('step-completed');
        }

        if (statusProp === order.status) {
            stepCompleted = false;
            time.innerText = moment(order.updatedAt).format('hh:mm A');
            status.appendChild(time);
            if (status.nextElementSibling) {
                status.nextElementSibling.classList.add('current');
            }

        }
    })


}

updateOrder(order);