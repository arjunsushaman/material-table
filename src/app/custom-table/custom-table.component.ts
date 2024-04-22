import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { TableDataService } from '../table-data.service';
import { MatDialog } from '@angular/material/dialog';
import { FormControl } from '@angular/forms';
import { merge, of as observableOf } from 'rxjs';
import { catchError, debounceTime, map, startWith, switchMap } from 'rxjs/operators';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

export interface ApiResponse {
  items: ResponseItem[];
  total_count: number;
}

export interface ResponseItem {
  created_at: string;
  number: string;
  state: string;
  title: string;
}

@Component({
  selector: 'app-custom-table',
  templateUrl: './custom-table.component.html',
  styleUrls: ['./custom-table.component.scss']
})
export class CustomTableComponent implements OnInit, AfterViewInit {
  ngOnInit(): void { }

  displayedColumns: string[] = ['created', 'state', 'id', 'title'];

  data: ResponseItem[] = [];

  pageSizes = [5, 10, 20];

  totalCount = 0;
  isLoading = true;
  limitReached = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(public tableDataService: TableDataService, private spinner: NgxSpinnerService, private snackBar: MatSnackBar) { }

  searchKeywordFilter = new FormControl();

  ngAfterViewInit() {
    this.sort.sortChange.subscribe(() => (this.paginator.pageIndex = 0));   // on sort order change, reset back to the first page.

    merge(this.searchKeywordFilter.valueChanges.pipe(debounceTime(500)), this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoading = true;
          this.spinner.show();
          var filterValue = this.searchKeywordFilter.value == null ? '' : this.searchKeywordFilter.value;
          return this.tableDataService
            .fetchTableData(
              filterValue,
              this.sort.active,
              this.sort.direction,
              this.paginator.pageIndex + 1,
              this.paginator.pageSize
            )
            .pipe(catchError(() => observableOf(null)));
        }),
        map((data) => {
          this.isLoading = false;
          this.spinner.hide();
          this.limitReached = data === null;

          if (this.limitReached) {
            this.snackBar.open('The API limit has been reached. Please try after a minute.', 'Close', {
              duration: 5000 
            });
          }

          if (data === null) {
            return [];
          }

          this.totalCount = data.total_count;
          return data.items;
        })
      )
      .subscribe((data) => (this.data = data));
  }
}




