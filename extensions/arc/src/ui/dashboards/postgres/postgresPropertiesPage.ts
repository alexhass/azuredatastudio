/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as azdata from 'azdata';
import * as loc from '../../../localizedConstants';
import { IconPathHelper, cssStyles } from '../../../constants';
import { KeyValueContainer, KeyValue, InputKeyValue, TextKeyValue } from '../../components/keyValueContainer';
import { DashboardPage } from '../../components/dashboardPage';
import { ControllerModel } from '../../../models/controllerModel';
import { PostgresModel } from '../../../models/postgresModel';

export class PostgresPropertiesPage extends DashboardPage {
	private loading?: azdata.LoadingComponent;
	private keyValueContainer?: KeyValueContainer;

	constructor(protected modelView: azdata.ModelView, private _controllerModel: ControllerModel, private _postgresModel: PostgresModel) {
		super(modelView);

		this.disposables.push(this._postgresModel.onConfigUpdated(
			() => this.eventuallyRunOnInitialized(() => this.handleServiceUpdated())));

		this.disposables.push(this._controllerModel.onRegistrationsUpdated(
			() => this.eventuallyRunOnInitialized(() => this.handleRegistrationsUpdated())));
	}

	protected get title(): string {
		return loc.properties;
	}

	protected get id(): string {
		return 'postgres-properties';
	}

	protected get icon(): { dark: string; light: string; } {
		return IconPathHelper.properties;
	}

	protected get container(): azdata.Component {
		const root = this.modelView.modelBuilder.divContainer().component();
		const content = this.modelView.modelBuilder.divContainer().component();
		root.addItem(content, { CSSStyles: { 'margin': '20px' } });

		content.addItem(this.modelView.modelBuilder.text().withProperties<azdata.TextComponentProperties>({
			value: loc.properties,
			CSSStyles: { ...cssStyles.title, 'margin-bottom': '25px' }
		}).component());

		this.keyValueContainer = new KeyValueContainer(this.modelView.modelBuilder, this.getProperties());
		this.disposables.push(this.keyValueContainer);

		this.loading = this.modelView.modelBuilder.loadingComponent()
			.withItem(this.keyValueContainer.container)
			.withProperties<azdata.LoadingComponentProperties>({
				loading: !this._postgresModel.configLastUpdated && !this._controllerModel.registrationsLastUpdated
			}).component();

		content.addItem(this.loading);
		this.initialized = true;
		return root;
	}

	protected get toolbarContainer(): azdata.ToolbarContainer {
		const refreshButton = this.modelView.modelBuilder.button().withProperties<azdata.ButtonProperties>({
			label: loc.refresh,
			iconPath: IconPathHelper.refresh
		}).component();

		this.disposables.push(
			refreshButton.onDidClick(async () => {
				refreshButton.enabled = false;
				try {
					this.loading!.loading = true;
					await Promise.all([
						this._postgresModel.refresh(),
						this._controllerModel.refresh()
					]);
				} catch (error) {
					vscode.window.showErrorMessage(loc.refreshFailed(error));
				}
				finally {
					refreshButton.enabled = true;
				}
			}));

		return this.modelView.modelBuilder.toolbarContainer().withToolbarItems([
			{ component: refreshButton }
		]).component();
	}

	private getProperties(): KeyValue[] {
		const endpoint = this._postgresModel.endpoint;
		const status = this._postgresModel.config?.status;

		return [
			new InputKeyValue(this.modelView.modelBuilder, loc.coordinatorEndpoint, endpoint ? `postgresql://postgres@${endpoint.ip}:${endpoint.port}` : ''),
			new InputKeyValue(this.modelView.modelBuilder, loc.postgresAdminUsername, 'postgres'),
			new TextKeyValue(this.modelView.modelBuilder, loc.status, status ? `${status.state} (${status.readyPods} ${loc.podsReady})` : loc.unknown),
			// TODO: Make this a LinkKeyValue that opens the controller dashboard
			new TextKeyValue(this.modelView.modelBuilder, loc.dataController, this._controllerModel.controllerConfig?.metadata.namespace ?? ''),
			new TextKeyValue(this.modelView.modelBuilder, loc.nodeConfiguration, this._postgresModel.scaleConfiguration ?? ''),
			new TextKeyValue(this.modelView.modelBuilder, loc.postgresVersion, this._postgresModel.engineVersion ?? ''),
			new TextKeyValue(this.modelView.modelBuilder, loc.resourceGroup, this._controllerModel.controllerConfig?.spec.settings.azure.resourceGroup ?? ''),
			new TextKeyValue(this.modelView.modelBuilder, loc.subscriptionId, this._controllerModel.controllerConfig?.spec.settings.azure.subscription ?? '')
		];
	}

	private handleRegistrationsUpdated() {
		this.keyValueContainer?.refresh(this.getProperties());
		this.loading!.loading = false;
	}

	private handleServiceUpdated() {
		this.keyValueContainer?.refresh(this.getProperties());
		this.loading!.loading = false;
	}
}
