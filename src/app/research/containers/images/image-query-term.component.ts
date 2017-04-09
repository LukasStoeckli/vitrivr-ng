import {Component, ViewChild, Input} from "@angular/core";
import {SketchDialogComponent} from "./sketch-dialog.component";
import {MdDialog, MdDialogRef} from '@angular/material';
import {ImageQueryTerm} from "../../../shared/model/queries/image-query-term.model";
import {BinarySketchDialogComponent} from "./binary-sketch-dialog.component";

@Component({
    selector: 'qt-image',
    template:`
        <img #previewimg style="width:150px; height:150px; border:solid 1px;" (click)="onViewerClicked()"/>
        
        <div style="display:flex; align-items: center; justify-content: center;">
            <md-slide-toggle [(ngModel)]="mode3D" (change)="onModeToggled($event)">3D sketch mode</md-slide-toggle>
        </div>
        
        <div style="display:flex; align-items: center; justify-content: center;" *ngIf="!mode3D">
            <md-icon class="muted" mdTooltip="Rough sketch">brush</md-icon>
            <div class="toolbar-spacer-small"></div>
            <md-slider min="0" max="4" step="1" value="2" [(ngModel)]="sliderSetting" (change)="onSettingsChanged($event)"></md-slider>
            <div class="toolbar-spacer-small"></div>
            <md-icon class="muted"  mdTooltip="Example image">insert_photo</md-icon>
        </div>
    `
})

export class ImageQueryTermComponent {

    /** Component used to display a preview of the selected AND/OR sketched image. */
    @ViewChild('previewimg') private previewimg: any;

    /** The ImageQueryTerm object associated with this ImageQueryTermComponent. That object holds all the settings. */
    @Input() imageTerm: ImageQueryTerm;

    /** Slider to adjust the query-term settings; i.e. to select the features used for image-queries. */
    public sliderSetting : number = 2;

    /** Slider to onToggleButtonClicked between normal image / sketch mode and 3D-sketch mode. */
    public mode3D : boolean = false;

    /**
     * Default constructor.
     *
     * @param dialog
     */
    constructor(public dialog: MdDialog) {
        this.dialog.afterOpen.subscribe(dialogRef => {
            let component = <SketchDialogComponent> dialogRef.componentInstance;
            let switched = false;

            /* Transfer current image if mode hasn't changed. */
            if (!this.mode3D) {
                component.sketchpad.setImageBase64(this.previewimg.nativeElement.src);
            }
        });
    }

    /**
     * Triggered whenever either the slider for the query settings is used.
     * Adjusts the settings in the ImageQueryTerm.
     *
     * @param event
     */
    public onSettingsChanged(event:any) {
        this.imageTerm.setting(this.sliderSetting);
    }

    /**
     * Triggered whenever the Mode 3D Slide toggle is used to switch between
     * 3D-sketch mode and normal mode.
     *
     * @param event
     */
    public onModeToggled(event:any) {
        if (this.mode3D) {
            this.sliderSetting = 101;
        } else {
            this.sliderSetting = 2;
        }
        this.imageTerm.setting(this.sliderSetting);
    }

    /**
     * Triggered whenever someone click on the image, which indicates that it should
     * be edited.
     */
    public onViewerClicked() {
        /* Initialize the correct dialog-component. */
        let dialogRef = null;
        if (this.mode3D) {
            dialogRef = this.dialog.open(BinarySketchDialogComponent)
        } else {
            dialogRef = this.dialog.open(SketchDialogComponent)
        }

        /* Register the onClose callback. */
        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.previewimg.nativeElement.src = result;
                this.imageTerm.data = result;
            }
        });
    }
}