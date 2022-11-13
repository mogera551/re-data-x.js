import html from "../../../../dist/importText.js?path=./components/main/main.html";

const tickets = [
  { id:1, name:"Economy", price: 199.95 },
  { id:2, name:"Bussiness", price: 449.22 },
  { id:3, name:"First Class", price: 1199.99 },
];

class ViewModel {
  "tickets" = tickets;
  "tickets.*";
  "tickets.*.id";
  "tickets.*.name";
  
  "selectTicketId" = "";

  get "selectTicket"() {
    if (this.selectTicketId === "") return null;
    return this.tickets.find(ticket => ticket.id === Number(this.selectTicketId)) ?? null;
  }
  "selectTicket.name";
  "selectTicket.price";

  clear() {
    this.selectTicketId = "";
  }

  $relativeProps = [
    [ "selectTicket", [ "selectTicketId" ] ]
  ];
}

export default {
  ViewModel, html
}
