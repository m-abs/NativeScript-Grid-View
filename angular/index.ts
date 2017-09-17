// External
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
  exports: [
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
