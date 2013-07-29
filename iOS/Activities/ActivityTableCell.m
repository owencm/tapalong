//
//  ActivityTableCell.m
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import "ActivityTableCell.h"

@implementation ActivityTableCell

- (id)initWithCoder:(UITableViewCellStyle)style reuseIdentifier:(NSString *)reuseIdentifier
{
    self = [super initWithStyle:style reuseIdentifier:reuseIdentifier];
    if (self) {
        self.autoresizingMask = UIViewAutoresizingFlexibleHeight;
        self.clipsToBounds = YES;
    }
    return self;
}

- (void)setSelected:(BOOL)selected animated:(BOOL)animated
{
    [super setSelected:selected animated:animated];
    if (selected) {
        [self.detailsButton setTitle:@"Hide Details" forState:UIControlStateNormal];
        self.descriptionLabel.hidden = NO;
        self.locationLabel.hidden = NO;
    } else {
        [self.detailsButton setTitle:@"Details" forState:UIControlStateNormal];
        self.descriptionLabel.hidden = YES;
        self.locationLabel.hidden = YES;
    }
}

- (IBAction)detailsPressed:(id)sender {
    // Todo: sort selection using this and fix problem listed here: http://stackoverflow.com/questions/1110482/reference-from-uitableviewcell-to-parent-uitableview
//    [self.superview ]
    [self setSelected:YES animated:YES];
}

-(void)refreshLayout
{
    [self.activityLabel sizeToFit];
    
    int titleBottomPadding = 6;
    int buttonHeight = 20;
    int buttonBottomPadding = 10;
    int titleOffset = self.activityLabel.frame.size.height + self.activityLabel.frame.origin.y;
    
    CGRect oldFrame = self.detailsButton.frame;
    [self.detailsButton setFrame: CGRectMake(oldFrame.origin.x, titleOffset + titleBottomPadding, oldFrame.size.width, oldFrame.size.height)];
    oldFrame = self.tapAlongButton.frame;
    [self.tapAlongButton setFrame: CGRectMake(oldFrame.origin.x, titleOffset + titleBottomPadding, oldFrame.size.width, oldFrame.size.height)];
    
    self.cellHeight = titleOffset + titleBottomPadding + buttonHeight + buttonBottomPadding;
    
}

@end
