# frozen_string_literal: true

module Jekyll
  class MarkdownFile < StaticFile
    def initialize(site, relative_path, url, collection)
      dir = File.dirname(relative_path)
      # `StaticFile` joins `dir` and `name` into its paths as plain strings. At
      # the site root, `dirname` gives ".", so pass `nil` instead.
      dir = nil if dir == "."
      name = File.basename(relative_path)
      super(site, site.source, dir, name, collection)
      @url = url
    end
  end

  module MarkdownSource
    class << self
      def generate(site)
        markdown_converter = site.find_converter_instance(Converters::Markdown)

        markdown_files = pages(site).filter_map do |page|
          next unless markdown_converter.matches(File.extname(page.relative_path))

          collection = page.is_a?(Document) ? page.collection : nil
          # If a collection is not published (`output: false`), do not publish
          # its Markdown source either.
          next if collection && !collection.write?

          # Skip virtual pages.
          next unless File.file?(source_path(site, page))

          url = markdown_url(page.url)
          # Available in layouts as `page.markdown_url`.
          page.data["markdown_url"] = url
          MarkdownFile.new(site, page.relative_path, url, collection)
        end

        site.static_files.concat(markdown_files)
      end

      private

      def pages(site)
        site.pages + site.collections.each_value.flat_map(&:docs)
      end

      # `Page#relative_path` is relative to the source directory, but
      # `Document#relative_path` is relative to the collections directory.
      def source_path(site, page)
        page.is_a?(Document) ? page.path : site.in_source_dir(page.relative_path)
      end

      # Follows the shape of the page's URL.
      #
      # @example
      #   markdown_url("/1970/01/01/post.html") #=> "/1970/01/01/post.md"
      #   markdown_url("/1970/01/01/post/")     #=> "/1970/01/01/post/index.md"
      def markdown_url(url)
        if url.end_with?("/")
          "#{url}index.md"
        else
          "#{url.delete_suffix(".html")}.md"
        end
      end
    end
  end
end

# This is a hook, not a `Generator`, because it has to run after
# `jekyll-relative-links`, and that plugin already has `:lowest` priority.
Jekyll::Hooks.register :site, :pre_render do |site|
  Jekyll::MarkdownSource.generate(site)
end
