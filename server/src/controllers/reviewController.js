  import { Review } from '../models/Review.js';
  import Joi from 'joi';
  import mongoose from 'mongoose';
  // TODO: write a validation schema for create/update per README.md section 2.
  export const reviewSchema = Joi.object({
    courseCode: Joi.string().required(),
    rating: Joi.number().integer().min(1).max(5).required(),
    comment: Joi.string().allow(''),
    reviewedBy: Joi.string(),
  });

  export const updateSchema = Joi.object({
    courseCode: Joi.string(),
    rating: Joi.number().integer().min(1).max(5),
    comment: Joi.string().allow(''),
    reviewedBy: Joi.string(),
  }).min(1);



  // GET /api/reviews
  // TODO: implement per README.md section 3.
  export async function getAllReviews(req, res, next) {
    try {
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .populate('reviewedBy', 'name email');
    res.json(reviews);
    }catch (err) { next(err); }
  }

  // GET /api/reviews/:id
  // TODO: implement per README.md sections 3 and 5.
  export async function getReview(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid review id' });
      }
  
      const review = await Review.findById(id).populate(
        'reviewedBy',
        'name email'
      );
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      res.json(review); 
    } catch (err) { next(err); }
  }

  // GET /api/reviews/summary?courseCode=CS101
  // TODO: implement per README.md section 4.
  export async function getCourseSummary(req, res, next) {
    try {
      const { courseCode } = req.query;
      // typeof check also blocks operator injection like ?courseCode[$ne]=x
      if (typeof courseCode !== 'string' || !courseCode.trim()) {
        return res
          .status(400)
          .json({ message: 'courseCode query parameter is required' });
      }
  
      const [summary] = await Review.aggregate([
        { $match: { courseCode } }, // keep only this course's reviews
        {
          $group: {
            _id: '$courseCode', // one group for the whole course
            averageRating: { $avg: '$rating' },
            reviewCount: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            courseCode: '$_id',
            averageRating: { $round: ['$averageRating', 1] },
            reviewCount: 1,
          },
        },
      ]);
  
      // No reviews yet: the pipeline returns [] so summary is undefined.
      res.json(summary ?? { courseCode, averageRating: null, reviewCount: 0 });
    } catch (err) { next(err); }
  }

  // POST /api/reviews
  // TODO: implement per README.md section 3.
  export async function createReview(req, res, next) {
  try {
      const { error, value } = reviewSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
  
      const review = await Review.create(value);
      res.status(201).json(review);
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(409)
          .json({ message: 'This user has already reviewed this course' });
      }
      next(err);
    }
  }

  // PATCH /api/reviews/:id
  // TODO: implement per README.md sections 3 and 5.
  export async function updateReview(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid review id' });
      }
  
      const { error, value } = updateSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ message: error.details[0].message });
      }
  
      const review = await Review.findByIdAndUpdate(id, value, {
        new: true, // return the updated document, not the old one
        runValidators: true, // run the model's rules on updates too
      });
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      res.json(review);
    } catch (err) {
      if (err.code === 11000) {
        return res
          .status(409)
          .json({ message: 'This user has already reviewed this course' });
      }
      next(err);
    }
  }

  // DELETE /api/reviews/:id
  // TODO: implement per README.md sections 3 and 5.
  export async function deleteReview(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: 'Invalid review id' });
      }
  
      const review = await Review.findByIdAndDelete(id);
      if (!review) {
        return res.status(404).json({ message: 'Review not found' });
      }
      res.json({ message: 'Review deleted' });
    } catch (err) { next(err); }
  }
