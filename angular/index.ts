// External
import { CommonModule } from "@angular/common";
import {
  NO_ERRORS_SCHEMA,
  NgModule,
} from "@angular/core";

import { GridTemplateKeyDirective, GridViewComponent } from "./grid-view-comp";

@NgModule({
  declarations: [
    GridTemplateKeyDirective,
    GridViewComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    CommonModule,
    GridTemplateKeyDirective,
    GridViewComponent,
  ],
  schemas: [
    NO_ERRORS_SCHEMA,
  ],
})
export class GridViewModule {
}

export { GridViewComponent, GridTemplateKeyDirective };
