import { NgModule }              from '@angular/core';
import { RouterModule, Routes }  from '@angular/router';
import {ObjectdetailsComponent} from "./objectdetails/objectdetails.component";
import {GalleryComponent} from "./gallery/gallery.component";
import {ObjectmetadataResolver} from "./objectdetails/objectmetadata-resolver.serivce";
import {ObjectdetailsResolver} from "./objectdetails/objectdetails-resolver.service";

/**
 * Defines the application's routes.
 */
const appRoutes: Routes = [
    {
        path: 'mediaobject/:objectId',
        component: ObjectdetailsComponent
    },
    { path: 'gallery', component: GalleryComponent },
    { path: '',  redirectTo: '/gallery', pathMatch: 'full' }
];

@NgModule({
    imports: [
        RouterModule.forRoot(appRoutes)
    ],
    exports: [
        RouterModule
    ],
    providers: [
    ]
})

export class AppRoutingModule { }