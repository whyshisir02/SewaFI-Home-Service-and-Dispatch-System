const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');
const providerService = require('./provider.service');
const bookingController = require('../bookings/booking.controller');
const paymentController = require('../payments/payment.controller');

const getMyProviderProfile = asyncHandler(async (req, res) => {
  const profile = await providerService.getMyProviderProfile(req.user.id);
  res.json(new ApiResponse(200, profile, 'Provider profile fetched'));
});

const updateMyProviderProfile = asyncHandler(async (req, res) => {
  const profile = await providerService.updateMyProviderProfile(req.user.id, req.body);
  res.json(new ApiResponse(200, profile, 'Provider profile updated'));
});

const updateMyAvailability = asyncHandler(async (req, res) => {
  const result = await providerService.updateMyAvailability(req.user.id, req.body.available);
  res.json(new ApiResponse(200, result, 'Availability updated'));
});

const updateMySchedule = asyncHandler(async (req, res) => {
  const result = await providerService.updateMySchedule(req.user.id, req.body);
  res.json(new ApiResponse(200, result, 'Provider schedule updated'));
});

const getAssignedJobs = asyncHandler(async (req, res) => {
  const { page, limit, skip, take } = getPagination(req.query);
  const jobs = await providerService.getAssignedJobs(req.user.id, req.query);
  const pagedJobs = jobs.slice(skip, skip + take);

  res.json(
    new ApiResponse(
      200,
      pagedJobs,
      'Assigned jobs fetched',
      buildPaginationMeta({ page, limit, total: jobs.length })
    )
  );
});

const listProviderServices = asyncHandler(async (req, res) => {
  const services = await providerService.listProviderServices(req.user.id);
  res.json(new ApiResponse(200, services, 'Provider services fetched'));
});

const addProviderService = asyncHandler(async (req, res) => {
  const service = await providerService.addProviderService(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, service, 'Provider service added'));
});

const removeProviderService = asyncHandler(async (req, res) => {
  const result = await providerService.removeProviderService(req.user.id, req.params.serviceId);
  res.json(new ApiResponse(200, result, 'Provider service removed'));
});

const listProviderAreas = asyncHandler(async (req, res) => {
  const areas = await providerService.listProviderAreas(req.user.id);
  res.json(new ApiResponse(200, areas, 'Provider working areas fetched'));
});

const addProviderArea = asyncHandler(async (req, res) => {
  const area = await providerService.addProviderArea(req.user.id, req.body);
  res.status(201).json(new ApiResponse(201, area, 'Provider working area added'));
});

const removeProviderArea = asyncHandler(async (req, res) => {
  const result = await providerService.removeProviderArea(req.user.id, req.params.areaId);
  res.json(new ApiResponse(200, result, 'Provider working area removed'));
});

module.exports = {
  getMyProviderProfile,
  updateMyProviderProfile,
  updateMyAvailability,
  updateMySchedule,
  listProviderServices,
  addProviderService,
  removeProviderService,
  listProviderAreas,
  addProviderArea,
  removeProviderArea,
  getNearbyJobs: bookingController.getAvailableProviderBookings,
  getAssignedJobs,
  getEarnings: paymentController.getProviderEarnings,
  submitFinalAmount: paymentController.submitProviderFinalAmount,
};
