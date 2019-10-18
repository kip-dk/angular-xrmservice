import { Component, OnInit } from '@angular/core';

import { AccountService } from './services/account.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  title: string;
  constructor(private accountService: AccountService) {
  }

  ngOnInit(): void {
    this.accountService.query().subscribe(r => {
      console.log(r);
    });
  }
}
