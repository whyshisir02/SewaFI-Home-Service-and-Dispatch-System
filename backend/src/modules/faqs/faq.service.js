const { prisma } = require('../../config/database');
const { getPagination, buildPaginationMeta } = require('../../utils/pagination');

const normalizeSection = (value) => {
  if (!value) return null;
  return String(value).trim().toLowerCase();
};

const toBoolean = (value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off'].includes(normalized)) return false;
  }
  return null;
};

const normalizeFaq = (faq) => ({
  ...faq,
  category: faq?.section || null,
  displayOrder: Number(faq?.sortOrder || 0),
  showOnHome: normalizeSection(faq?.section) === 'home',
});

const listPublicFaqs = async (query = {}) => {
  const showOnHome = toBoolean(query.showOnHome);
  const section = normalizeSection(query.section || query.category);
  const rawLimit = Number(query.limit);
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 50) : undefined;

  const faqs = await prisma.fAQ.findMany({
    where: {
      isActive: true,
      ...(showOnHome === true
        ? { section: 'home' }
        : section
          ? { section }
          : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    ...(limit ? { take: limit } : {}),
  });

  return faqs.map(normalizeFaq);
};

const listAdminFaqs = async (query = {}) => {
  const section = normalizeSection(query.section);
  const showOnHome = toBoolean(query.showOnHome);
  const search = String(query.search || '').trim();
  const { page, limit, skip, take } = getPagination(query);

  const where = {
    ...(showOnHome === true
      ? { section: 'home' }
      : showOnHome === false
        ? { NOT: { section: 'home' } }
        : section
          ? { section }
          : {}),
    ...(query.isActive === 'true' ? { isActive: true } : {}),
    ...(query.isActive === 'false' ? { isActive: false } : {}),
    ...(search
      ? {
          OR: [
            { question: { contains: search, mode: 'insensitive' } },
            { answer: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [faqs, total] = await Promise.all([
    prisma.fAQ.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
      skip,
      take,
    }),
    prisma.fAQ.count({ where }),
  ]);

  return {
    faqs: faqs.map(normalizeFaq),
    meta: buildPaginationMeta({ page, limit, total }),
  };
};

const createFaq = async (payload = {}) => {
  const showOnHome = toBoolean(payload.showOnHome) === true;
  const sectionFromPayload = normalizeSection(payload.section || payload.category);
  const displayOrder = payload.displayOrder !== undefined ? payload.displayOrder : payload.sortOrder;

  const faq = await prisma.fAQ.create({
    data: {
      question: String(payload.question || '').trim(),
      answer: String(payload.answer || '').trim(),
      section: showOnHome ? 'home' : sectionFromPayload,
      isActive: payload.isActive !== undefined ? Boolean(payload.isActive) : true,
      sortOrder: Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0,
    },
  });

  return normalizeFaq(faq);
};

const updateFaq = async (id, payload = {}) => {
  const existing = await prisma.fAQ.findUnique({ where: { id } });
  const data = {};

  if (payload.question !== undefined) data.question = String(payload.question || '').trim();
  if (payload.answer !== undefined) data.answer = String(payload.answer || '').trim();
  if (payload.section !== undefined || payload.category !== undefined) {
    data.section = normalizeSection(payload.section ?? payload.category);
  }
  if (payload.showOnHome !== undefined) {
    const showOnHome = toBoolean(payload.showOnHome);
    if (showOnHome === true) {
      data.section = 'home';
    } else if (showOnHome === false) {
      const nextSection = normalizeSection(payload.section ?? payload.category);
      data.section =
        nextSection ||
        (normalizeSection(existing?.section) === 'home' ? null : existing?.section || null);
    }
  }
  if (payload.isActive !== undefined) data.isActive = Boolean(payload.isActive);
  const displayOrder = payload.displayOrder !== undefined ? payload.displayOrder : payload.sortOrder;
  if (displayOrder !== undefined) {
    data.sortOrder = Number.isFinite(Number(displayOrder)) ? Number(displayOrder) : 0;
  }

  const faq = await prisma.fAQ.update({
    where: { id },
    data,
  });

  return normalizeFaq(faq);
};

const deleteFaq = async (id) => prisma.fAQ.delete({ where: { id } });

module.exports = {
  listPublicFaqs,
  listAdminFaqs,
  createFaq,
  updateFaq,
  deleteFaq,
};
