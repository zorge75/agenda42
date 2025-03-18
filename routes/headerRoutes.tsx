import React from 'react';
import {
	componentPagesMenu,
	dashboardPagesMenu,
	demoPagesMenu,
	pageLayoutTypesPagesMenu,
} from '../menu';
import DashboardHeader from '../pages/_layout/_headers/DashboardHeader';

const headers = [
	{ path: pageLayoutTypesPagesMenu.pageLayout.subMenu.onlySubheader.path, element: null },
	{ path: pageLayoutTypesPagesMenu.pageLayout.subMenu.onlyContent.path, element: null },
	{ path: pageLayoutTypesPagesMenu.blank.path, element: null },
	{ path: demoPagesMenu.login.path, element: null },
	{ path: demoPagesMenu.signUp.path, element: null },
	{ path: demoPagesMenu.page404.path, element: null },
	{ path: demoPagesMenu.knowledge.subMenu.grid.path, element: null },
	{ path: dashboardPagesMenu.dashboard.path, element: <DashboardHeader /> },
	{
		path: demoPagesMenu.projectManagement.subMenu.list.path,
		element: <DashboardHeader />,
	},
	{ path: demoPagesMenu.pricingTable.path, element: <DashboardHeader /> },
	// {
	// 	path: dashboardPagesMenu.dashboardBooking.path,
	// 	element: <DashboardBookingHeader />,
	// },
	// {
	// 	path: demoPagesMenu.calendar.path,
	// 	element: <DashboardBookingHeader />,
	// },
	// {
	// 	path: demoPagesMenu.employeeList.path,
	// 	element: <DashboardBookingHeader />,
	// },
	// {
	// 	path: demoPagesMenu.listPages.subMenu.listFluid.path,
	// 	element: <DashboardBookingHeader />,
	// },
	// {
	// 	path: `${demoPagesMenu.editPages.path}/*`,
	// 	element: <DashboardBookingHeader />,
	// },
	// {
	// 	path: `${demoPagesMenu.employeeID.path}/[id]`,
	// 	element: <DashboardBookingHeader />,
	// },
	// {
	// 	path: `${demoPagesMenu.projectManagement.subMenu.itemID.path}/[id]`,
	// 	element: <DashboardBookingHeader />,
	// },
	// {
	// 	path: demoPagesMenu.singlePages.subMenu.fluidSingle.path,
	// 	element: <ProfilePageHeader />,
	// },
	// {
	// 	path: demoPagesMenu.singlePages.subMenu.boxedSingle.path,
	// 	element: <ProfilePageHeader />,
	// },
	// {
	// 	path: demoPagesMenu.sales.subMenu.transactions.path,
	// 	element: <ProfilePageHeader />,
	// },
	// {
	// 	path: demoPagesMenu.chat.subMenu.withListChat.path,
	// 	element: <ProfilePageHeader />,
	// },
	// {
	// 	path: demoPagesMenu.chat.subMenu.onlyListChat.path,
	// 	element: <ProfilePageHeader />,
	// },
	// {
	// 	path: `${demoPagesMenu.knowledge.subMenu.itemID.path}/[id]`,
	// 	element: <ProfilePageHeader />,
	// },
	// {
	// 	path: demoPagesMenu.crm.subMenu.dashboard.path,
	// 	element: <ProfilePageHeader />,
	// },
	// {
	// 	path: demoPagesMenu.crm.subMenu.customersList.path,
	// 	element: <ProfilePageHeader />,
	// },
	// {
	// 	path: `${demoPagesMenu.crm.subMenu.customerID.path}/[id]`,
	// 	element: <ProfilePageHeader />,
	// },
	// {
	// 	path: dashboardPagesMenu.summary.path,
	// 	element: <SummaryHeader />,
	// },
	// {
	// 	path: demoPagesMenu.gridPages.subMenu.gridBoxed.path,
	// 	element: <ProductsHeader />,
	// },
	// {
	// 	path: demoPagesMenu.gridPages.subMenu.gridFluid.path,
	// 	element: <ProductsHeader />,
	// },
	// {
	// 	path: demoPagesMenu.listPages.subMenu.listBoxed.path,
	// 	element: <ProductListHeader />,
	// },
	// {
	// 	path: demoPagesMenu.sales.subMenu.salesList.path,
	// 	element: <ProductListHeader />,
	// },
	// {
	// 	path: demoPagesMenu.sales.subMenu.productsGrid.path,
	// 	element: <ProductListHeader />,
	// },
	// {
	// 	path: `${demoPagesMenu.sales.subMenu.productID.path}/[id]`,
	// 	element: <ProductListHeader />,
	// },
	// {
	// 	path: `${pageLayoutTypesPagesMenu.asideTypes.path}/*`,
	// 	element: <PageLayoutHeader />,
	// },
	// {
	// 	path: pageLayoutTypesPagesMenu.pageLayout.subMenu.headerAndSubheader.path,
	// 	element: <PageLayoutHeader />,
	// },
	// {
	// 	path: pageLayoutTypesPagesMenu.pageLayout.subMenu.onlyHeader.path,
	// 	element: <PageLayoutHeader />,
	// },
	// {
	// 	path: `${componentPagesMenu.components.path}/*`,
	// 	element: <ComponentsHeader />,
	// },
	// {
	// 	path: `${componentPagesMenu.forms.path}/*`,
	// 	element: <FormHeader />,
	// },
	// {
	// 	path: `${componentPagesMenu.charts.path}/*`,
	// 	element: <ChartsHeader />,
	// },
	// {
	// 	path: `${componentPagesMenu.content.path}/*`,
	// 	element: <ContentHeader />,
	// },
	// {
	// 	path: `${componentPagesMenu.utilities.path}/*`,
	// 	element: <UtilitiesHeader />,
	// },
	// {
	// 	path: `${componentPagesMenu.icons.path}/*`,
	// 	element: <IconHeader />,
	// },
	// {
	// 	path: `/*`,
	// 	element: <DefaultHeader />,
	// },
];

export default headers;
