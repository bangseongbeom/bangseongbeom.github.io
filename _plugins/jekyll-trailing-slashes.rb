# frozen_string_literal: true

module JekyllTrailingSlashes
  module Hooks
    class << self
      def set_permalinks(site)
        site.posts.docs.each do |doc|
          next unless in_collection_subdirectory?(doc)
          next if doc.data["permalink"]

          permalink = with_trailing_slash(doc.url_template)
          doc.data["permalink"] = permalink unless permalink == doc.url_template
        end
      end

      private

      # Whether the document sits in a subdirectory of its collection.
      #
      # @example
      #   # doc.relative_path == "_posts/1970-01-01-post.md"
      #   in_collection_subdirectory?(doc) #=> false
      #
      #   # doc.relative_path == "_posts/folder/1970-01-01-post.md"
      #   in_collection_subdirectory?(doc) #=> true
      def in_collection_subdirectory?(doc)
        File.dirname(doc.relative_path).include?("/")
      end

      # Drops `:output_ext` and ends the template with a slash.
      #
      # @example
      #   with_trailing_slash("/:categories/:title:output_ext") #=> "/:categories/:title/"
      #   with_trailing_slash("/:categories/:title/")           #=> "/:categories/:title/"
      #   with_trailing_slash("/:categories/:title")            #=> "/:categories/:title/"
      def with_trailing_slash(url_template)
        "#{url_template.delete_suffix(":output_ext").delete_suffix("/")}/"
      end
    end
  end
end

Jekyll::Hooks.register :site, :post_read do |site|
  JekyllTrailingSlashes::Hooks.set_permalinks(site)
end
