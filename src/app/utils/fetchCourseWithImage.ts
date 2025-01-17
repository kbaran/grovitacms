import payload from 'payload';

async function fetchAllCoursesWithImages() {
  try {
    const courses = await payload.find({
      collection: 'courses',
      limit: 100, // Adjust limit as needed
    });

    const coursesWithImages = await Promise.all(
      courses.docs.map(async (course) => {
        let imageUrl = null;

        if (course.image && typeof course.image === 'string') {
          try {
            // Fetch image from the media collection
            const image = await payload.findByID({
              collection: 'media',
              id: course.image,
            });
            // Construct the image URL
            imageUrl = image?.url || `${process.env.BLOB_BASE_URL}/${image.filename}`;
          } catch (error) {
            console.error(`Error fetching image for course: ${course.title}`, error);
          }
        } else {
          console.warn(`Course "${course.title}" does not have a valid image ID.`);
        }

        // Return course with resolved image URL
        return {
          ...course,
          image: imageUrl,
        };
      })
    );

    return coursesWithImages;
  } catch (error) {
    console.error('Error fetching courses:', error);
    return [];
  }
}

export default fetchAllCoursesWithImages;