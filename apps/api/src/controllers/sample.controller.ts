import { Request, Response } from 'express';

export class SampleController {
  async getSampleData(_req: Request, res: Response) {
    return res.status(200).json({ success: true, data: [], message: 'Sample endpoint is active' });
  }

  async getSampleDataById(req: Request, res: Response) {
    const { id } = req.params;
    return res.status(200).json({ success: true, data: { id }, message: 'Sample by ID' });
  }

  async createSampleData(req: Request, res: Response) {
    return res.status(201).json({ success: true, data: req.body, message: 'Sample created' });
  }
}
