const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const env = require('../../config/env');
const faqService = require('./faq.service');
const { CACHE_KEYS, CACHE_TTL_SECONDS, rememberCache, deleteCache } = require('../../utils/cache');

const getPublicFaqs = asyncHandler(async (req, res) => {
  const allFaqs = await rememberCache(CACHE_KEYS.publicFaqs, CACHE_TTL_SECONDS.publicFaqs, () =>
    faqService.listPublicFaqs({})
  );
  const section = String(req.query?.section || req.query?.category || '').trim().toLowerCase();
  const showOnHomeRaw = String(req.query?.showOnHome || '').trim().toLowerCase();
  const showOnHome =
    showOnHomeRaw === 'true' || showOnHomeRaw === '1'
      ? true
      : showOnHomeRaw === 'false' || showOnHomeRaw === '0'
        ? false
        : null;
  const rawLimit = Number(req.query?.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : null;

  let faqs = allFaqs.filter((faq) => faq?.isActive !== false);

  if (showOnHome === true) {
    faqs = faqs.filter(
      (faq) =>
        faq?.showOnHome === true ||
        String(faq?.section || '').toLowerCase() === 'home'
    );
  } else if (section) {
    faqs = faqs.filter((faq) => String(faq?.section || '').toLowerCase() === section);
  }

  if (limit) {
    faqs = faqs.slice(0, limit);
  }

  const publicFaqs = faqs.map((faq) => ({
    id: faq.id,
    question: faq.question,
    answer: faq.answer,
    category: faq.category || faq.section || null,
    displayOrder: faq.displayOrder ?? faq.sortOrder ?? 0,
    showOnHome: faq.showOnHome === true || String(faq?.section || '').toLowerCase() === 'home',
  }));
  res.json(new ApiResponse(200, publicFaqs, 'FAQs fetched'));
});

const getPublicSiteSettings = asyncHandler(async (req, res) => {
  const payload = {
    siteName: process.env.SITE_NAME || env.EMAIL?.FROM_NAME || null,
    supportEmail: env.EMAIL?.FROM_ADDRESS || null,
    contactEmail: env.EMAIL?.FROM_ADDRESS || null,
    supportPhone: process.env.SUPPORT_PHONE || null,
    supportHours: process.env.SUPPORT_HOURS || null,
    frontendUrl: env.FRONTEND_URL || null,
  };

  res.json(new ApiResponse(200, payload, 'Public site settings fetched'));
});

const getPublicContactInfo = asyncHandler(async (req, res) => {
  const payload = {
    email: env.EMAIL?.FROM_ADDRESS || null,
    phone: process.env.SUPPORT_PHONE || null,
    address: process.env.SUPPORT_ADDRESS || null,
    supportHours: process.env.SUPPORT_HOURS || null,
  };

  res.json(new ApiResponse(200, payload, 'Public contact info fetched'));
});

const listAdminFaqs = asyncHandler(async (req, res) => {
  const result = await faqService.listAdminFaqs(req.query);
  res.json(new ApiResponse(200, result.faqs, 'Admin FAQs fetched', result.meta));
});

const createAdminFaq = asyncHandler(async (req, res) => {
  const question = String(req.body.question || '').trim();
  const answer = String(req.body.answer || '').trim();

  if (!question || !answer) {
    throw new ApiError(400, 'Question and answer are required');
  }

  const faq = await faqService.createFaq(req.body);
  await deleteCache(CACHE_KEYS.publicFaqs);
  res.status(201).json(new ApiResponse(201, faq, 'FAQ created'));
});

const updateAdminFaq = asyncHandler(async (req, res) => {
  if (req.body.question !== undefined && !String(req.body.question || '').trim()) {
    throw new ApiError(400, 'Question cannot be empty');
  }

  if (req.body.answer !== undefined && !String(req.body.answer || '').trim()) {
    throw new ApiError(400, 'Answer cannot be empty');
  }

  const faq = await faqService.updateFaq(req.params.id, req.body);
  await deleteCache(CACHE_KEYS.publicFaqs);
  res.json(new ApiResponse(200, faq, 'FAQ updated'));
});

const deleteAdminFaq = asyncHandler(async (req, res) => {
  await faqService.deleteFaq(req.params.id);
  await deleteCache(CACHE_KEYS.publicFaqs);
  res.json(new ApiResponse(200, null, 'FAQ deleted'));
});

module.exports = {
  getPublicFaqs,
  getPublicSiteSettings,
  getPublicContactInfo,
  listAdminFaqs,
  createAdminFaq,
  updateAdminFaq,
  deleteAdminFaq,
};
