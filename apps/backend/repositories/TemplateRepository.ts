import { AppDataSource } from "../database/data-source";
import { Template } from "../entities/Template";

export const TemplateRepository = AppDataSource.getRepository(Template);

export const getTemplates = async () => {
  return await TemplateRepository.find();
};

export const getTemplateById = async (id: number) => {
  return await TemplateRepository.findOneBy({ id });
};

export const createTemplate = async (templateData: Omit<Template, "id">) => {
  const template = TemplateRepository.create(templateData);
  return await TemplateRepository.save(template);
};

export const updateTemplate = async (
  id: number,
  templateData: Partial<Omit<Template, "id">>
) => {
  await TemplateRepository.update(id, templateData);
  return await TemplateRepository.findOneBy({ id });
};

export const deleteTemplate = async (id: number) => {
  const template = await TemplateRepository.findOneBy({ id });
  if (template) {
    await TemplateRepository.remove(template);
    return true;
  }
  return false;
};
